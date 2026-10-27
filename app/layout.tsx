import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'DrivoPrep | Code 2 Mock Test',
  description: 'Practice your South African learner licence Code 2 driving test with DrivoPrep.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

// React's development-only RSC performance tracks measure server components
// that redirect after an await. The `end` timestamp can be negative because it
// mixes the server debug clock with the browser time origin, which makes
// Chromium throw inside performance.measure and breaks the Next.js dev overlay.
// Clamp invalid timestamps so development stays usable.
// Upstream: https://github.com/facebook/react/issues/37561
//           https://github.com/vercel/next.js/issues/99032
const measureGuard = `(function () {
  if (typeof performance === 'undefined') return;
  if (typeof performance.measure !== 'function') return;
  if (performance.__drivoprepMeasureGuard) return;
  performance.__drivoprepMeasureGuard = true;
  var original = performance.measure.bind(performance);
  performance.measure = function (name, options) {
    if (options && typeof options === 'object' && !Array.isArray(options)) {
      var patched = Object.assign({}, options);
      var start = patched.start;
      var end = patched.end;
      if (typeof start === 'number' && (!isFinite(start) || start < 0)) start = 0;
      if (typeof end === 'number' && (!isFinite(end) || end < 0)) {
        end = typeof start === 'number' ? start : 0;
      }
      if (typeof start === 'number' && typeof end === 'number' && end < start) {
        end = start;
      }
      patched.start = start;
      patched.end = end;
      return original(name, patched);
    }
    return original.apply(null, arguments);
  };
})();`

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
        {process.env.NODE_ENV === 'development' && (
          <script dangerouslySetInnerHTML={{ __html: measureGuard }} />
        )}
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
