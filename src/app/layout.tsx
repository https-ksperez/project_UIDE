import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'UIDE Campus Delivery',
  description: 'El sistema oficial de delivery universitario para la comunidad de la UIDE. Pide de tus cafeterías preferidas y recíbelo en tus puntos de encuentro dentro del campus de forma rápida y segura.',
  keywords: ['UIDE', 'delivery', 'universitario', 'campus', 'comida', 'estudiantes'],
  authors: [{ name: 'UIDE Dev Team' }],
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans min-h-screen flex flex-col`}
      >
        <Providers>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
