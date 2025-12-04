import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import ToastProvider from '@/components/ToastProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

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
    <html lang="fr" data-theme="retro" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Navigation />
          <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24 animate-fade-in">
            {children}
          </main>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}

