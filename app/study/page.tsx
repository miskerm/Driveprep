import type { Metadata } from 'next'
import { StudyPage } from '@/components/pages/study-page'
import { getStudyCategories } from '@/lib/db'
import { requirePremium } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Study Materials | DrivoPrep',
  description: 'Study organised categories with modules and practice questions.',
}

export default async function StudyRoute() {
  await requirePremium('/study')
  const categories = await getStudyCategories()
  return <StudyPage categories={categories} />
}
