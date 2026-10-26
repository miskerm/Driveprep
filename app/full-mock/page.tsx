import type { Metadata } from 'next'
import { FullMockTestPage } from '@/components/pages/mock-test-page'
import { requirePremium } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Full Mock Test | DrivoPrep',
  description: 'Complete a full 64-question Code 2 mock test.',
}

export default async function FullMockRoute() {
  await requirePremium('/full-mock')
  return <FullMockTestPage />
}
