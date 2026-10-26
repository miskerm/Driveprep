import type { Metadata } from 'next'
import { InfoPage } from '@/components/pages/info-page'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Account | DrivoPrep' }

export default async function AccountPage() {
  await requireUser('/account')
  return <InfoPage page="account" />
}
