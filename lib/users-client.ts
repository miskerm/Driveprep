export type AppUser = {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: 'user' | 'admin'
  status: 'active' | 'terminated'
  paymentStatus: 'unpaid' | 'pending' | 'approved' | 'rejected'
  premiumEntitlement: boolean
  premiumActivatedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type AuthUser = AppUser & { passwordHash: string }

export function isAdmin(user: Pick<AppUser, 'role' | 'status'>) {
  return user.role === 'admin' && user.status === 'active'
}

export function hasPremium(user: Pick<AppUser, 'status' | 'paymentStatus' | 'premiumEntitlement' | 'role'>) {
  if (user.role === 'admin') return user.status === 'active'
  return user.status === 'active' && user.paymentStatus === 'approved' && user.premiumEntitlement
}

export function accountKey(user: Pick<AppUser, 'id' | 'email' | 'phone'>) {
  return user.email || user.phone || `user-${user.id}`
}
