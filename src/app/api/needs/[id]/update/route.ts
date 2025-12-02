import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, internalNotes } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes

    const need = await prisma.need.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(need)
  } catch (error) {
    console.error('Error updating need:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

