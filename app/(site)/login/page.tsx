import type { Metadata } from 'next'
import { LoginPage } from '@/components/pages/login-page'
import { safeCallbackUrl } from '@/lib/rate-limit'

export const metadata: Metadata = {
  title: 'Login | DrivoPrep',
  description: 'Login to your DrivoPrep learner account.',
}

export default async function LoginRoute({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const params = await searchParams
  return <LoginPage callbackUrl={safeCallbackUrl(params.callbackUrl, '/dashboard')} />
}
