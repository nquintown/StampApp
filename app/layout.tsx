import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeSync from '@/components/ThemeSync'
import AuthProvider from '@/components/AuthProvider'
import Toast from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Stampverse',
  description: 'Ta collection de stamps personnelle',
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
    <html lang="fr">
      <head>
        {/* Restore dark mode before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body>
        <ThemeSync />
        <AuthProvider />
        <Toast />
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  )
}
