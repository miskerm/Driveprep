import { NextResponse } from 'next/server'
import { registerLearnerDevice } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { hasPremium, accountKey } from '@/lib/users'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const limit = rateLimit(`device-register:${user.id}`, 60, 60 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many device checks. Try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const data = (body ?? {}) as Record<string, unknown>
  const deviceId = String(data.deviceId ?? '').trim().slice(0, 100)
  const label = String(data.label ?? '').trim().slice(0, 80) || 'Unknown device'
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 400)

  if (!deviceId) {
    return NextResponse.json({ error: 'A device id is required.' }, { status: 400 })
  }

  try {
    const access = await registerLearnerDevice({
      email: accountKey(user),
      name: user.name,
      plan: hasPremium(user) ? 'premium_1000' : 'free',
      deviceId,
      label,
      userAgent,
    })

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
  } catch (error) {
    console.error('Could not register learner device:', error)
    return NextResponse.json({ error: 'Device tracking is unavailable right now.' }, { status: 503 })
  }
}
