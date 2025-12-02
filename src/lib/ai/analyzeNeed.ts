import OpenAI from 'openai'
import { prisma } from '../prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const PROMPT = `Tu es un expert en conception d'applications web/mobiles/SaaS. 

À partir des informations du client (problème, situation actuelle, solution souhaitée, budget, délais, langue, fichiers), effectue :

1. Un résumé clair du besoin (5-10 lignes).
2. Une liste des objectifs principaux.
3. Une proposition détaillée de solution (modules essentiels).
4. Une estimation de complexité (Faible, Moyenne, Élevée).
5. Une fourchette estimative du budget.
6. Une estimation du délai.
7. Une liste de risques.

Réponds au format JSON avec les clés suivantes :
{
  "summary": "...",
  "objectives": "...",
  "proposedSolution": "...",
  "complexityLevel": "LOW" | "MEDIUM" | "HIGH",
  "estimatedDuration": "...",
  "estimatedBudgetRange": "...",
  "risks": "..."
}`

export async function analyzeNeed(needId: string) {
  const need = await prisma.need.findUnique({
    where: { id: needId },
    include: { files: true },
  })

  if (!need) {
    throw new Error('Need not found')
  }

  const context = `
INFORMATIONS CLIENT:
- Nom: ${need.clientName}
- Email: ${need.clientEmail || 'Non fourni'}
- Téléphone: ${need.clientPhone || 'Non fourni'}
- Entreprise: ${need.companyName || 'Non fourni'}

PROBLÈME DÉCRIT:
${need.problemDescription}

SITUATION ACTUELLE:
${need.currentSituation}

SOLUTION SOUHAITÉE:
${need.desiredSolution}

RÉFÉRENCES D'APPLICATIONS:
${need.knownAppReferences || 'Aucune référence fournie'}

BUDGET:
${need.budgetMin && need.budgetMax ? `${need.budgetMin}€ - ${need.budgetMax}€` : need.budgetMin ? `Minimum: ${need.budgetMin}€` : need.budgetMax ? `Maximum: ${need.budgetMax}€` : 'Non spécifié'}

DÉLAI:
${need.deadlinePreference || 'Non spécifié'}

PRIORITÉ:
${need.priority}

LANGUE:
${need.language || 'Non spécifiée'}

FICHIERS JOINTS:
${need.files.length > 0 ? need.files.map(f => `- ${f.originalName} (${f.type})`).join('\n') : 'Aucun fichier joint'}
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: PROMPT,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const analysis = JSON.parse(content)

    // Save analysis
    const savedAnalysis = await prisma.needAnalysis.create({
      data: {
        needId,
        summary: analysis.summary || '',
        objectives: analysis.objectives || '',
        proposedSolution: analysis.proposedSolution || '',
        complexityLevel: analysis.complexityLevel || 'MEDIUM',
        estimatedDuration: analysis.estimatedDuration || null,
        estimatedBudgetRange: analysis.estimatedBudgetRange || null,
        risks: analysis.risks || null,
      },
    })

    return savedAnalysis
  } catch (error) {
    console.error('Error analyzing need:', error)
    throw error
  }
}

