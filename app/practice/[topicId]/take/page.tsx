import type { Metadata } from 'next'
import { PracticeTakePage } from '@/components/pages/practice-take-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Practice | DrivoPrep',
  description: 'Practice learner test questions with instant feedback.',
}

export default async function PracticeTakePageRoute({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params
  return <PracticeTakePage topicId={topicId} />
}
