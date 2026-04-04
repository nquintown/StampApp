import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeSync from '@/components/ThemeSync'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'Stampverse',
  description: 'Your personal stamp collection',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeSync />
        <AuthProvider />
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  )
}
