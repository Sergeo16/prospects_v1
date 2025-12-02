import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const need = await prisma.need.findUnique({
      where: { id: params.id },
      include: {
        files: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!need) {
      return NextResponse.json({ error: 'Need not found' }, { status: 404 })
    }

    return NextResponse.json(need)
  } catch (error) {
    console.error('Error fetching need:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du besoin' },
      { status: 500 }
    )
  }
}

