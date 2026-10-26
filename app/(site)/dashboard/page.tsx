import type { Metadata } from 'next'
import { Dashboard } from '@/components/pages/dashboard'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard | DrivoPrep',
  description: 'Track your learner progress, streaks, and practice results.',
}

export default async function DashboardPage() {
  await requireUser('/dashboard')
  return <Dashboard />
}
