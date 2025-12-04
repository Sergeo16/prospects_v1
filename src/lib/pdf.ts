import { prisma } from './prisma'

interface PDFData {
  need: any
  analysis: any
}

export async function generateNeedPDF(needId: string): Promise<Buffer> {
  const need = await prisma.need.findUnique({
    where: { id: needId },
    include: {
      files: true,
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!need) {
    throw new Error('Need not found')
  }

  const analysis = need.analyses[0] || null

  // Generate PDF HTML content
  const htmlContent = generatePDFHTML(need, analysis)

  // For now, return HTML content
  // In production, use a library like puppeteer or pdfkit to generate actual PDF
  // This is a simplified version that returns HTML that can be converted to PDF
  
  return Buffer.from(htmlContent, 'utf-8')
}

function generatePDFHTML(need: any, analysis: any): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#ef4444'
      case 'MEDIUM':
        return '#f59e0b'
      case 'LOW':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'Haute'
      case 'MEDIUM':
        return 'Moyenne'
      case 'LOW':
        return 'Basse'
      default:
        return priority
    }
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fiche Client - ${need.clientName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #fff;
    }
    .header {
      border-bottom: 3px solid #00d9ff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #00d9ff;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .info-value {
      font-size: 14px;
      color: #1a1a1a;
    }
    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }
    .text-content {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.8;
    }
    .analysis-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .analysis-box h3 {
      margin-bottom: 15px;
      font-size: 18px;
    }
    .analysis-box p {
      margin-bottom: 10px;
      opacity: 0.95;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Fiche Client</h1>
    <div class="subtitle">Généré le ${formatDate(new Date())}</div>
  </div>

  <div class="section">
    <div class="section-title">Informations Client</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nom complet</div>
        <div class="info-value">${need.clientName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${need.clientEmail || 'Non fourni'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Téléphone</div>
        <div class="info-value">${need.clientPhone || 'Non fourni'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Entreprise</div>
        <div class="info-value">${need.companyName || 'Non fourni'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Priorité</div>
        <div class="info-value">
          <span class="priority-badge" style="background-color: ${priorityColor(need.priority)}">
            ${priorityLabel(need.priority)}
          </span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Statut</div>
        <div class="info-value">${need.status}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Problème à résoudre</div>
    <div class="text-content">${need.problemDescription}</div>
  </div>

  <div class="section">
    <div class="section-title">Situation actuelle</div>
    <div class="text-content">${need.currentSituation}</div>
  </div>

  <div class="section">
    <div class="section-title">Solution souhaitée</div>
    <div class="text-content">${need.desiredSolution}</div>
  </div>

  ${need.budgetMin || need.budgetMax ? `
  <div class="section">
    <div class="section-title">Budget</div>
    <div class="info-grid">
      ${need.budgetMin ? `
      <div class="info-item">
        <div class="info-label">Budget minimum</div>
        <div class="info-value">${need.budgetMin.toLocaleString('fr-FR')} €</div>
      </div>
      ` : ''}
      ${need.budgetMax ? `
      <div class="info-item">
        <div class="info-label">Budget maximum</div>
        <div class="info-value">${need.budgetMax.toLocaleString('fr-FR')} €</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${need.deadlinePreference ? `
  <div class="section">
    <div class="section-title">Délai souhaité</div>
    <div class="text-content">${need.deadlinePreference}</div>
  </div>
  ` : ''}

  ${analysis ? `
  <div class="section">
    <div class="section-title">Analyse IA</div>
    <div class="analysis-box">
      <h3>Résumé</h3>
      <p>${analysis.summary}</p>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Complexité</div>
        <div class="info-value">${analysis.complexityLevel}</div>
      </div>
      ${analysis.priorityScore ? `
      <div class="info-item">
        <div class="info-label">Score de priorité</div>
        <div class="info-value">${analysis.priorityScore}/100</div>
      </div>
      ` : ''}
      ${analysis.isUrgent ? `
      <div class="info-item">
        <div class="info-label">Urgence</div>
        <div class="info-value">🔴 Urgent</div>
      </div>
      ` : ''}
      ${analysis.estimatedDuration ? `
      <div class="info-item">
        <div class="info-label">Durée estimée</div>
        <div class="info-value">${analysis.estimatedDuration}</div>
      </div>
      ` : ''}
      ${analysis.estimatedBudgetRange ? `
      <div class="info-item">
        <div class="info-label">Budget estimé</div>
        <div class="info-value">${analysis.estimatedBudgetRange}</div>
      </div>
      ` : ''}
    </div>
    ${analysis.objectives ? `
    <div style="margin-top: 20px;">
      <div class="info-label" style="margin-bottom: 10px;">Objectifs</div>
      <div class="text-content">${analysis.objectives}</div>
    </div>
    ` : ''}
    ${analysis.proposedSolution ? `
    <div style="margin-top: 20px;">
      <div class="info-label" style="margin-bottom: 10px;">Solution proposée</div>
      <div class="text-content">${analysis.proposedSolution}</div>
    </div>
    ` : ''}
    ${analysis.recommendations ? `
    <div style="margin-top: 20px;">
      <div class="info-label" style="margin-bottom: 10px;">Recommandations</div>
      <div class="text-content">${analysis.recommendations}</div>
    </div>
    ` : ''}
    ${analysis.risks ? `
    <div style="margin-top: 20px;">
      <div class="info-label" style="margin-bottom: 10px;">Risques identifiés</div>
      <div class="text-content">${analysis.risks}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${need.files.length > 0 ? `
  <div class="section">
    <div class="section-title">Fichiers joints</div>
    <div class="info-grid">
      ${need.files.map((file: any) => `
      <div class="info-item">
        <div class="info-label">${file.originalName}</div>
        <div class="info-value">${file.type} - ${file.size ? (file.size / 1024).toFixed(2) + ' KB' : 'Taille inconnue'}</div>
      </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Document généré automatiquement par Prospects v1</p>
    <p>ID: ${need.id}</p>
  </div>
</body>
</html>
  `
}

