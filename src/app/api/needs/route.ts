import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveFile, getFileType } from '@/lib/storage'
import { analyzeNeed } from '@/lib/ai/analyzeNeed'

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
    const formData = await request.formData()

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

    const files = formData.getAll('files') as File[]

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

    return NextResponse.json({ id: need.id, success: true })
  } catch (error) {
    console.error('Error creating need:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du besoin' },
      { status: 500 }
    )
  }
}
