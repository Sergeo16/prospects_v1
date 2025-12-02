import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const need = await prisma.need.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json(need)
  } catch (error) {
    console.error('Error archiving need:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'archivage' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const need = await prisma.need.update({
      where: { id: params.id },
      data: { deletedAt: null },
    })

    return NextResponse.json(need)
  } catch (error) {
    console.error('Error restoring need:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la restauration' },
      { status: 500 }
    )
  }
}

