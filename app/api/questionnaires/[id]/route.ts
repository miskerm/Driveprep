import { NextResponse } from 'next/server'
import { getStudyQuestionnaireById } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { hasPremium } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (!hasPremium(user)) {
    return NextResponse.json({ error: 'Premium access is required.' }, { status: 403 })
  }

  const { id } = await params
  const questionnaire = await getStudyQuestionnaireById(id)
  if (!questionnaire) {
    return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 })
  }

  return NextResponse.json(questionnaire)
}
