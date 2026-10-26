import 'server-only'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getLearnerAccess } from '@/lib/db'
import { accountKey, getUserById, isAdmin, type AppUser } from '@/lib/users'

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth()
  const rawId = session?.user?.id
  if (!rawId) return null

  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) return null

  return getUserById(id)
}

function loginUrl(callbackUrl: string) {
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
}

export async function requireUser(callbackUrl = '/dashboard'): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect(loginUrl(callbackUrl))
  if (user.status === 'terminated') redirect('/account/terminated')
  return user
}

export async function requirePremium(callbackUrl = '/dashboard'): Promise<AppUser> {
  const user = await requireUser(callbackUrl)

  if (isAdmin(user)) return user

  const access = await getLearnerAccess(accountKey(user))
  if (access?.restricted) redirect('/dashboard?restricted=1')

  if (user.paymentStatus === 'approved' && user.premiumEntitlement) return user
  if (user.paymentStatus === 'pending') redirect('/payment/pending')

  redirect('/payment')
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser('/admin')
  if (user.status === 'terminated') redirect('/account/terminated')
  if (!isAdmin(user)) redirect('/dashboard')
  return user
}

export async function getAdminUser(): Promise<AppUser | null> {
  const user = await getCurrentUser()
  return user && isAdmin(user) ? user : null
}
