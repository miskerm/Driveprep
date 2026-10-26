import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { normalizeIdentifier } from '@/lib/identifiers'
import { verifyPassword } from '@/lib/password'
import { rateLimit } from '@/lib/rate-limit'
import { getUserByIdentifier, touchLastLogin } from '@/lib/users'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'Email or phone',
      credentials: {
        identifier: { label: 'Email or phone number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = normalizeIdentifier(credentials?.identifier)
        const password = typeof credentials?.password === 'string' ? credentials.password : ''

        if (!identifier || !password || password.length > 200) return null

        // Throttle credential stuffing even when someone posts directly to
        // the Auth.js callback instead of using the login form.
        const limit = rateLimit(`credentials:${identifier.value}`, 10, 10 * 60 * 1000)
        if (!limit.ok) return null

        const user = await getUserByIdentifier(identifier)
        if (!user || !user.passwordHash) return null

        const valid = await verifyPassword(password, user.passwordHash)
        if (!valid) return null

        await touchLastLogin(user.id)

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          paymentStatus: user.paymentStatus,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role ?? 'user'
        token.status = user.status ?? 'active'
        token.paymentStatus = user.paymentStatus ?? 'unpaid'
        token.phone = user.phone ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? '')
        session.user.role = (token.role as 'user' | 'admin' | undefined) ?? 'user'
        session.user.status = (token.status as 'active' | 'terminated' | undefined) ?? 'active'
        session.user.paymentStatus = (token.paymentStatus as 'unpaid' | 'pending' | 'approved' | 'rejected' | undefined) ?? 'unpaid'
        session.user.phone = (token.phone as string | null | undefined) ?? null
      }
      return session
    },
  },
})
