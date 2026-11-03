import type { Metadata } from 'next'
import { QuestionnaireTakePage } from '@/components/pages/questionnaire-take-page'
import { requirePremium } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Take Questionnaire | DrivoPrep',
  description: 'Answer the questions in this questionnaire.',
}

export default async function QuestionnaireTakeRoute({ params }: { params: Promise<{ id: string }> }) {
  await requirePremium('/questionnaires')
  const { id } = await params
  return <QuestionnaireTakePage questionnaireId={id} />
}
