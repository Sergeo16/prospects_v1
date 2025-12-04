import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveFile, getFileType } from '@/lib/storage'
import { analyzeNeed } from '@/lib/ai/analyzeNeed'
import {
  rateLimit,
  detectSpam,
  validateHoneypot,
  validateEmail,
  validatePhone,
  validateFileUpload,
  getClientIP,
  isBot,
} from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const archived = searchParams.get('archived') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (archived) {
      where.deletedAt = { not: null }
    } else {
      where.deletedAt = null
    }

    if (status) {
      where.status = status
    }

    const [needs, total] = await Promise.all([
      prisma.need.findMany({
        where,
        include: {
          files: true,
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.need.count({ where }),
    ])

    return NextResponse.json({
      needs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching needs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des besoins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security checks
    const ip = getClientIP(request)
    
    // Rate limiting: 10 requests per 15 minutes per IP
    const rateLimitResult = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
      identifier: ip,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Bot detection
    if (isBot(request)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const formData = await request.formData()

    // Honeypot check
    if (!validateHoneypot(formData)) {
      // Silently reject (don't reveal it's a honeypot)
      return NextResponse.json({ id: 'fake-id', success: true })
    }

    const clientName = formData.get('clientName') as string
    const clientEmail = formData.get('clientEmail') as string | null
    const clientPhone = formData.get('clientPhone') as string | null
    const companyName = formData.get('companyName') as string | null
    const problemDescription = formData.get('problemDescription') as string
    const currentSituation = formData.get('currentSituation') as string
    const desiredSolution = formData.get('desiredSolution') as string
    const knownAppReferences = formData.get('knownAppReferences') as string | null
    const budgetMin = formData.get('budgetMin') as string | null
    const budgetMax = formData.get('budgetMax') as string | null
    const deadlinePreference = formData.get('deadlinePreference') as string | null
    const priority = (formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM'
    const language = formData.get('language') as string | null

    // Validation
    if (!clientName || clientName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      )
    }

    if (clientName.length > 200) {
      return NextResponse.json(
        { error: 'Le nom est trop long (max 200 caractères)' },
        { status: 400 }
      )
    }

    // Spam detection
    const combinedText = `${problemDescription} ${currentSituation} ${desiredSolution}`.toLowerCase()
    if (detectSpam(combinedText)) {
      return NextResponse.json(
        { error: 'Le contenu semble suspect. Veuillez réessayer avec un texte plus détaillé.' },
        { status: 400 }
      )
    }

    // Email validation
    if (clientEmail) {
      const emailValidation = validateEmail(clientEmail)
      if (!emailValidation.valid) {
        return NextResponse.json(
          { error: emailValidation.reason },
          { status: 400 }
        )
      }
    }

    // Phone validation
    if (clientPhone) {
      const phoneValidation = validatePhone(clientPhone)
      if (!phoneValidation.valid) {
        return NextResponse.json(
          { error: phoneValidation.reason },
          { status: 400 }
        )
      }
    }

    const files = formData.getAll('files') as File[]

    // Validate files
    for (const file of files) {
      if (file.size > 0) {
        const fileValidation = validateFileUpload(file)
        if (!fileValidation.valid) {
          return NextResponse.json(
            { error: fileValidation.reason },
            { status: 400 }
          )
        }
      }
    }

    // Create Need
    const need = await prisma.need.create({
      data: {
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        companyName: companyName || null,
        problemDescription,
        currentSituation,
        desiredSolution,
        knownAppReferences: knownAppReferences || null,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        deadlinePreference: deadlinePreference || null,
        priority,
        language: language || null,
        status: 'NEW',
      },
    })

    // Save files
    for (const file of files) {
      if (file.size > 0) {
        const { url } = await saveFile(file, need.id)
        const fileType = getFileType(file.type)

        await prisma.needFile.create({
          data: {
            needId: need.id,
            type: fileType,
            url,
            mimeType: file.type,
            originalName: file.name,
            size: file.size,
          },
        })
      }
    }

    // Trigger AI analysis in background (don't wait for it)
    analyzeNeed(need.id).catch((error) => {
      console.error('Error analyzing need:', error)
    })

    return NextResponse.json(
      { id: need.id, success: true },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Error creating need:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du besoin' },
      { status: 500 }
    )
  }
}
