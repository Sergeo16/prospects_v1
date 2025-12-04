import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Prospects - Collecte de Besoins Clients',
  description: 'Plateforme de collecte intelligente des besoins clients avec analyse IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" data-theme="retro">
      <body className={inter.className}>
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">{children}</main>
        <ToastProvider />
      </body>
    </html>
  )
}

