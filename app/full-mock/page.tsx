import { redirect } from 'next/navigation'
import { requirePremium } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function FullMockRoute() {
  await requirePremium('/full-mock')
  redirect('/mock-tests')
}
