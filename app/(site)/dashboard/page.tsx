import type { Metadata } from 'next'
import { Dashboard } from '@/components/pages/dashboard'
import { requireUser } from '@/lib/session'
import { getStudyCategories } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard | DrivoPrep',
  description: 'Track your learner progress, streaks, and practice results.',
}

export default async function DashboardPage() {
  await requireUser('/dashboard')
  const categories = await getStudyCategories()
  return <Dashboard categories={categories} />
}
