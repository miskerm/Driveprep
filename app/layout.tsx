import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import { MeasureGuard } from '@/components/measure-guard'
import './globals.css'

export const metadata: Metadata = {
  title: "Selam Learner's",
  description: "Practice your Driver Licence Examination with Selam Learner's.",
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/selamlogo1.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/selamlogo1.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/selamlogo1.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/selamlogo1.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {process.env.NODE_ENV === 'development' && <MeasureGuard />}
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
