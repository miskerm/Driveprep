import { NextResponse } from 'next/server'
import { getLearnerAccess } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { accountKey } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const access = await getLearnerAccess(accountKey(user))

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      paymentStatus: user.paymentStatus,
      premiumEntitlement: user.premiumEntitlement,
    },
    access,
  })
}
