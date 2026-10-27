import { NextResponse } from 'next/server'
import { getStudyModuleFile } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { accountKey, hasPremium } from '@/lib/users'
import { getLearnerAccess } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (user.status === 'terminated') {
    return NextResponse.json({ error: 'This account has been terminated.' }, { status: 403 })
  }
  if (!hasPremium(user)) {
    return NextResponse.json({ error: 'Premium access is required.' }, { status: 403 })
  }

  const limit = rateLimit(`module-download:${user.id}`, 120, 60 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many module requests. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429 },
    )
  }

  const access = await getLearnerAccess(accountKey(user))
  if (access?.restricted) {
    return NextResponse.json({ error: 'Premium access is restricted for this account.' }, { status: 403 })
  }

  const { id } = await params
  const moduleId = Number(id)

  if (!Number.isFinite(moduleId) || moduleId <= 0) {
    return new Response('Invalid module id', { status: 400 })
  }

  const studyModule = await getStudyModuleFile(moduleId)
  if (!studyModule || !studyModule.fileUrl) {
    return new Response('Module file not found', { status: 404 })
  }

  return NextResponse.redirect(studyModule.fileUrl)
}
