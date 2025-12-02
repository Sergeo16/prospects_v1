'use client'

import { useEffect, useState } from 'react'
import AdminHeader from '@/components/AdminHeader'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inReview: 0,
    inProgress: 0,
    done: 0,
    archived: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/needs?limit=1000')
      .then((res) => res.json())
      .then((data) => {
        const needs = data.needs || []
        setStats({
          total: needs.length,
          new: needs.filter((n: any) => n.status === 'NEW').length,
          inReview: needs.filter((n: any) => n.status === 'IN_REVIEW').length,
          inProgress: needs.filter((n: any) => n.status === 'IN_PROGRESS').length,
          done: needs.filter((n: any) => n.status === 'DONE').length,
          archived: needs.filter((n: any) => n.deletedAt).length,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total', value: stats.total, badge: 'badge-primary', href: '/ss91/needs' },
    { label: 'Nouveaux', value: stats.new, badge: 'badge-success', href: '/ss91/needs?status=NEW' },
    { label: 'En révision', value: stats.inReview, badge: 'badge-warning', href: '/ss91/needs?status=IN_REVIEW' },
    { label: 'En cours', value: stats.inProgress, badge: 'badge-info', href: '/ss91/needs?status=IN_PROGRESS' },
    { label: 'Terminés', value: stats.done, badge: 'badge-neutral', href: '/ss91/needs?status=DONE' },
    { label: 'Archivés', value: stats.archived, badge: 'badge-error', href: '/ss91/needs?archived=true' },
  ]

  return (
    <div className="flex-1">
      <AdminHeader title="Dashboard" />
      <div className="p-6 bg-base-100">
        {loading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card) => (
              <Link key={card.label} href={card.href}>
                <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base-content/70 text-sm font-medium">{card.label}</p>
                        <p className="text-3xl font-bold text-primary mt-2">
                          {card.value}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Link href="/ss91/needs" className="btn btn-outline btn-primary">
                <span className="text-2xl">📋</span>
                Voir tous les besoins
              </Link>
              <Link href="/ss91/users" className="btn btn-outline btn-primary">
                <span className="text-2xl">👥</span>
                Gérer les utilisateurs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
