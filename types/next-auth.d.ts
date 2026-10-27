import type { DefaultSession } from 'next-auth'
import type { AccountStatus, PaymentStatus, UserRole } from '@/lib/account-types'

declare module 'next-auth' {
  interface User {
    role?: UserRole
    status?: AccountStatus
    paymentStatus?: PaymentStatus
    premiumEntitlement?: boolean
    phone?: string | null
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      status: AccountStatus
      paymentStatus: PaymentStatus
      premiumEntitlement: boolean
      phone: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: UserRole
    status?: AccountStatus
    paymentStatus?: PaymentStatus
    premiumEntitlement?: boolean
    phone?: string | null
  }
}
