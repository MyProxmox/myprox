import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyProx Ops Center',
  description: 'MyProx — Infrastructure Management Dashboard',
  icons: {
    icon: 'https://cdn.myprox.app/img/logos/myprox-logo-purple.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-bg text-text min-h-screen">{children}</body>
    </html>
  )
}
