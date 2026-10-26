import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']

const protectedPrefixes = [
  '/dashboard',
  '/study',
  '/practice',
  '/full-mock',
  '/quizzes',
  '/payment',
  '/account',
  '/admin',
]

/**
 * Fast UX redirect for signed-out visitors. This is only a first line of
 * defence: every protected page, server action, and API route re-checks the
 * session and the user's database record server-side.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next()
  }

  const hasSessionCookie = SESSION_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value))
  if (hasSessionCookie) return NextResponse.next()

  const login = new URL('/login', request.url)
  login.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/study/:path*',
    '/practice/:path*',
    '/full-mock/:path*',
    '/quizzes/:path*',
    '/payment/:path*',
    '/account/:path*',
    '/admin/:path*',
  ],
}
