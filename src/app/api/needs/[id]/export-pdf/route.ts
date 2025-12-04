import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { generateNeedPDF } from '@/lib/pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const pdfBuffer = await generateNeedPDF(id)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'text/html', // For now, return HTML. In production, convert to PDF
        'Content-Disposition': `attachment; filename="fiche-client-${id}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

