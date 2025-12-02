import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { analyzeNeed } from '@/lib/ai/analyzeNeed'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysis = await analyzeNeed(params.id)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Error analyzing need:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'analyse' },
      { status: 500 }
    )
  }
}

