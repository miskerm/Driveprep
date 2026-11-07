import type { Metadata } from 'next'
import { SignupPage } from '@/components/pages/signup-page'
import { safeCallbackUrl } from '@/lib/rate-limit'

export const metadata: Metadata = {
  title: "Sign up | Selam Learner's",
  description: "Create your Selam Learne'r account.",
}

export default async function SignupRoute({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const params = await searchParams
  return <SignupPage callbackUrl={safeCallbackUrl(params.callbackUrl, '/payment')} />
}
