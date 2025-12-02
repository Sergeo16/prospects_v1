'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const needId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [need, setNeed] = useState<any>(null)

  useEffect(() => {
    if (needId) {
      fetch(`/api/needs/${needId}`)
        .then((res) => res.json())
        .then((data) => {
          setNeed(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [needId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="card bg-base-200 shadow-2xl">
          <div className="card-body p-8 md:p-12 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Demande reçue avec succès !
              </h1>
              <p className="text-base-content/70">
                Votre besoin a été enregistré et sera analysé par notre IA.
              </p>
            </div>

            {need && (
              <div className="card bg-base-300 shadow-md mb-6">
                <div className="card-body text-left">
                  <h2 className="card-title mb-4">Résumé de votre demande</h2>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">Nom:</span> {need.clientName}
                    </p>
                    {need.clientEmail && (
                      <p>
                        <span className="font-semibold">Email:</span> {need.clientEmail}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Statut:</span>{' '}
                      <span className="badge badge-primary badge-sm">
                        {need.status === 'NEW' ? 'Nouveau' : need.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Date:</span>{' '}
                      {new Date(need.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-base-content/70">
                Notre équipe va analyser votre demande et vous contactera prochainement.
              </p>
              <div className="pt-4">
                <Link href="/" className="btn btn-primary">
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
