'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebar() {
  const pathname = usePathname()

  const menuItems = [
    { href: '/ss91', label: 'Dashboard', icon: '📊' },
    { href: '/ss91/needs', label: 'Besoins', icon: '📋' },
    { href: '/ss91/users', label: 'Utilisateurs', icon: '👥' },
    { href: '/ss91/settings', label: 'Paramètres', icon: '⚙️' },
  ]

  return (
    <div className="w-64 bg-base-200 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        <p className="text-base-content/70 text-sm">Prospects v1</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`btn btn-ghost w-full justify-start ${
                isActive ? 'btn-active' : ''
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 pt-8 border-t border-base-300">
        <Link
          href="/ss91/change-password"
          className="btn btn-ghost w-full justify-start"
        >
          <span className="text-xl">🔒</span>
          <span>Changer mot de passe</span>
        </Link>
        <form action="/api/auth/logout" method="POST" className="mt-2">
          <button
            type="submit"
            className="btn btn-ghost w-full justify-start"
          >
            <span className="text-xl">🚪</span>
            <span>Déconnexion</span>
          </button>
        </form>
      </div>
    </div>
  )
}
