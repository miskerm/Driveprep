import type { Metadata } from 'next'
import { QuickQuizPage } from '@/components/pages/mock-test-page'
import { requirePremium } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quick Quiz | DrivoPrep',
  description: 'Try a short warm-up quiz to test your learner knowledge.',
}

export default async function QuizzesRoute() {
  await requirePremium('/quizzes')
  return <QuickQuizPage />
}
