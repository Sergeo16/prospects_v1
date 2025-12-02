'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import Link from 'next/link'

export default function NeedsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [needs, setNeeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const status = searchParams.get('status')
  const archived = searchParams.get('archived') === 'true'

  useEffect(() => {
    fetchNeeds()
  }, [page, status, archived])

  const fetchNeeds = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    })
    if (status) params.append('status', status)
    if (archived) params.append('archived', 'true')

    const res = await fetch(`/api/needs?${params}`)
    const data = await res.json()
    setNeeds(data.needs || [])
    setTotalPages(data.pagination?.totalPages || 1)
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-green-100 text-green-800',
      IN_REVIEW: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      DONE: 'bg-gray-100 text-gray-800',
      ARCHIVED: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.NEW}`}>
        {status}
      </span>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex-1">
      <AdminHeader title="Gestion des besoins" />
      <div className="p-6">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => router.push('/ss91/needs')}
            className={`px-4 py-2 rounded ${!status && !archived ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Tous
          </button>
          <button
            onClick={() => router.push('/ss91/needs?status=NEW')}
            className={`px-4 py-2 rounded ${status === 'NEW' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Nouveaux
          </button>
          <button
            onClick={() => router.push('/ss91/needs?archived=true')}
            className={`px-4 py-2 rounded ${archived ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Archivés
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : needs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucun besoin trouvé</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {needs.map((need) => (
                    <tr key={need.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{need.clientName}</div>
                        {need.companyName && (
                          <div className="text-sm text-gray-500">{need.companyName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {need.clientEmail || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(need.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {need.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(need.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/ss91/needs/${need.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="px-4 py-2">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

