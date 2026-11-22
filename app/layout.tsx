import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { PwaRegister } from '@/components/pwa-register'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'DIN STIL · Reservá tu turno',
  description: 'Reservá tu turno en DIN STIL en 4 toques.',
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    title: 'DIN STIL',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/din-stil-mark.jpg',
    apple: '/din-stil-mark.jpg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2d4428',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        <PwaRegister />
        {children}
        <Toaster position="top-center" toastOptions={{ style: { borderRadius: 12, border: '1px solid #ececec' } }} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
