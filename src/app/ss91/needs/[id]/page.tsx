'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'

export default function NeedDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [need, setNeed] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [internalNotes, setInternalNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    fetchNeed()
  }, [params.id])

  const fetchNeed = async () => {
    const res = await fetch(`/api/needs/${params.id}`)
    const data = await res.json()
    setNeed(data)
    setInternalNotes(data.internalNotes || '')
    setLoading(false)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      await fetch(`/api/needs/${params.id}/analyze`, { method: 'POST' })
      await fetchNeed()
    } catch (error) {
      alert('Erreur lors de l\'analyse')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/needs/${params.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchNeed()
    } catch (error) {
      alert('Erreur lors de la mise à jour')
    }
  }

  const handleArchive = async () => {
    if (confirm('Archiver ce besoin ?')) {
      try {
        await fetch(`/api/needs/${params.id}/archive`, { method: 'POST' })
        router.push('/ss91/needs')
      } catch (error) {
        alert('Erreur lors de l\'archivage')
      }
    }
  }

  const handleRestore = async () => {
    try {
      await fetch(`/api/needs/${params.id}/archive`, { method: 'DELETE' })
      router.push('/ss91/needs')
    } catch (error) {
      alert('Erreur lors de la restauration')
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await fetch(`/api/needs/${params.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes }),
      })
      alert('Notes sauvegardées')
    } catch (error) {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1">
        <AdminHeader title="Chargement..." />
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!need) {
    return (
      <div className="flex-1">
        <AdminHeader title="Besoin introuvable" />
      </div>
    )
  }

  const latestAnalysis = need.analyses?.[0]

  return (
    <div className="flex-1">
      <AdminHeader title={`Besoin: ${need.clientName}`} />
      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-4 flex gap-2 flex-wrap">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyse en cours...' : '🔍 Relancer analyse IA'}
          </button>
          <select
            value={need.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="NEW">Nouveau</option>
            <option value="IN_REVIEW">En révision</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DONE">Terminé</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
          {need.deletedAt ? (
            <button
              onClick={handleRestore}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Restaurer
            </button>
          ) : (
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Archiver
            </button>
          )}
        </div>

        {/* Informations client */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Informations client</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="font-medium">{need.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{need.clientEmail || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium">{need.clientPhone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Entreprise</p>
              <p className="font-medium">{need.companyName || '-'}</p>
            </div>
          </div>
        </div>

        {/* Besoin */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Détails du besoin</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Problème</p>
              <p className="whitespace-pre-wrap">{need.problemDescription}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Situation actuelle</p>
              <p className="whitespace-pre-wrap">{need.currentSituation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Solution souhaitée</p>
              <p className="whitespace-pre-wrap">{need.desiredSolution}</p>
            </div>
            {need.knownAppReferences && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Références</p>
                <p>{need.knownAppReferences}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium">
                  {need.budgetMin && need.budgetMax
                    ? `${need.budgetMin}€ - ${need.budgetMax}€`
                    : need.budgetMin
                    ? `Min: ${need.budgetMin}€`
                    : need.budgetMax
                    ? `Max: ${need.budgetMax}€`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Délai</p>
                <p className="font-medium">{need.deadlinePreference || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priorité</p>
                <p className="font-medium">{need.priority}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fichiers */}
        {need.files && need.files.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Fichiers joints ({need.files.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {need.files.map((file: any) => (
                <div key={file.id} className="border rounded p-2">
                  {file.type === 'IMAGE' ? (
                    <img src={file.url} alt={file.originalName} className="w-full h-32 object-cover rounded" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-4xl">📄</span>
                    </div>
                  )}
                  <p className="text-xs mt-2 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Ouvrir
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyse IA */}
        {latestAnalysis && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Analyse IA</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Résumé</p>
                <p className="whitespace-pre-wrap">{latestAnalysis.summary}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Objectifs</p>
                <p className="whitespace-pre-wrap">{latestAnalysis.objectives}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Solution proposée</p>
                <p className="whitespace-pre-wrap">{latestAnalysis.proposedSolution}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Complexité</p>
                  <p className="font-medium">{latestAnalysis.complexityLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Durée estimée</p>
                  <p className="font-medium">{latestAnalysis.estimatedDuration || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget estimé</p>
                  <p className="font-medium">{latestAnalysis.estimatedBudgetRange || '-'}</p>
                </div>
                {latestAnalysis.risks && (
                  <div>
                    <p className="text-sm text-gray-500">Risques</p>
                    <p className="font-medium whitespace-pre-wrap text-sm">{latestAnalysis.risks}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Analyse générée le{' '}
                {new Date(latestAnalysis.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        )}

        {/* Notes internes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Notes internes</h3>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ajoutez des notes internes sur ce besoin..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {savingNotes ? 'Sauvegarde...' : 'Sauvegarder les notes'}
          </button>
        </div>
      </div>
    </div>
  )
}

