import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getPaymentConfig } from '@/lib/payment-config'
import { accountKey } from '@/lib/users'
import { PaymentVerifyPage } from '@/components/pages/payment-verify-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upload payment proof | DrivoPrep',
  description: 'Send your payment screenshot for admin verification.',
}

export default async function PaymentVerifyRoute() {
  const user = await requireUser('/payment/verify')

  if (user.status === 'terminated') redirect('/account/terminated')
  if (user.paymentStatus === 'approved' && user.premiumEntitlement) redirect('/dashboard')
  if (user.paymentStatus === 'pending') redirect('/payment/pending')

  const config = getPaymentConfig()
  if (!config.configured) redirect('/payment')

  return <PaymentVerifyPage amountLabel={config.amountLabel} userIdentifier={accountKey(user)} />
}
