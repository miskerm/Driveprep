import type { Metadata } from 'next'
import { PracticePage } from '@/components/pages/practice-page'
import { requirePremium } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Practice Questions | DrivoPrep',
  description: 'Practise learner test questions with instant feedback.',
}

export default async function PracticeRoute() {
  await requirePremium('/practice')
  return <PracticePage />
}
