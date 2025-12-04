import OpenAI from 'openai'
import { prisma } from '../prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const PROMPT = `Tu es un expert senior en conception d'applications web/mobiles/SaaS avec 15+ ans d'expérience.

À partir des informations du client (problème, situation actuelle, solution souhaitée, budget, délais, langue, fichiers), effectue une analyse complète et professionnelle :

1. **Résumé exécutif** : Résumé clair et concis du besoin (5-10 lignes).
2. **Objectifs principaux** : Liste structurée des objectifs business et techniques.
3. **Proposition de solution** : Architecture détaillée avec modules essentiels, technologies recommandées, et roadmap.
4. **Niveau de complexité** : Évaluation technique (LOW, MEDIUM, HIGH) avec justification.
5. **Estimation budgétaire** : Fourchette réaliste basée sur la complexité et les fonctionnalités.
6. **Estimation de délai** : Timeline détaillée par phase de développement.
7. **Risques identifiés** : Liste des risques techniques, business et opérationnels avec mitigation.
8. **Score de priorité** : Score de 0 à 100 basé sur :
   - Urgence du besoin (mots-clés : urgent, ASAP, critique, bloquant)
   - Impact business potentiel
   - Budget disponible
   - Délai souhaité
   - Complexité technique
9. **Détection d'urgence** : true/false basé sur les indicateurs d'urgence dans le texte.
10. **Recommandations personnalisées** : Suggestions spécifiques pour optimiser le projet (technologies, approches, bonnes pratiques).
11. **Cahier des charges** : Structure détaillée transformant le besoin en spécifications techniques exploitables.

Réponds au format JSON avec les clés suivantes :
{
  "summary": "...",
  "objectives": "...",
  "proposedSolution": "...",
  "complexityLevel": "LOW" | "MEDIUM" | "HIGH",
  "estimatedDuration": "...",
  "estimatedBudgetRange": "...",
  "risks": "...",
  "priorityScore": 0-100,
  "isUrgent": true/false,
  "recommendations": "...",
  "technicalSpecs": "..."
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

    // Calculate priority score if not provided
    let priorityScore = analysis.priorityScore
    if (!priorityScore || priorityScore < 0 || priorityScore > 100) {
      // Auto-calculate based on various factors
      priorityScore = 50 // Base score
      
      // Urgency boost
      if (analysis.isUrgent) priorityScore += 30
      
      // Complexity adjustment
      if (analysis.complexityLevel === 'HIGH') priorityScore += 10
      if (analysis.complexityLevel === 'LOW') priorityScore -= 10
      
      // Budget availability
      if (need.budgetMin && need.budgetMin > 10000) priorityScore += 10
      if (need.budgetMax && need.budgetMax > 50000) priorityScore += 10
      
      // Deadline urgency
      const deadlineText = (need.deadlinePreference || '').toLowerCase()
      if (deadlineText.includes('asap') || deadlineText.includes('urgent') || deadlineText.includes('immédiat')) {
        priorityScore += 20
      }
      
      // Priority field
      if (need.priority === 'HIGH') priorityScore += 15
      if (need.priority === 'LOW') priorityScore -= 15
      
      // Clamp between 0 and 100
      priorityScore = Math.max(0, Math.min(100, priorityScore))
    }

    // Detect urgency from text if not provided
    let isUrgent = analysis.isUrgent
    if (typeof isUrgent !== 'boolean') {
      const urgentKeywords = ['urgent', 'asap', 'critique', 'bloquant', 'immédiat', 'rapide', 'prioritaire']
      const combinedText = `${need.problemDescription} ${need.currentSituation} ${need.desiredSolution} ${need.deadlinePreference}`.toLowerCase()
      isUrgent = urgentKeywords.some(keyword => combinedText.includes(keyword)) || need.priority === 'HIGH'
    }

    // Save analysis with enhanced fields
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
        priorityScore: priorityScore,
        isUrgent: isUrgent,
        recommendations: analysis.recommendations || null,
        technicalSpecs: analysis.technicalSpecs || null,
      },
    })

    return savedAnalysis
  } catch (error) {
    console.error('Error analyzing need:', error)
    throw error
  }
}

