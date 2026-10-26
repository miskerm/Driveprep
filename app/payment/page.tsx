import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getPaymentConfig } from '@/lib/payment-config'
import { getLatestPaymentForUser } from '@/lib/payments'
import { PaymentInstructions } from '@/components/pages/payment-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payment | DrivoPrep',
  description: 'Complete your manual payment and send proof for admin verification.',
}

export default async function PaymentRoute() {
  const user = await requireUser('/payment')

  if (user.status === 'terminated') redirect('/account/terminated')
  if (user.paymentStatus === 'approved' && user.premiumEntitlement) redirect('/dashboard')
  if (user.paymentStatus === 'pending') redirect('/payment/pending')

  const latest = await getLatestPaymentForUser(user.id)
  if (latest?.status === 'pending') redirect('/payment/pending')

  const config = getPaymentConfig()

  return (
    <PaymentInstructions
      user={{ name: user.name, email: user.email, phone: user.phone }}
      config={config}
      rejectedReason={latest?.status === 'rejected' ? latest.reason : null}
    />
  )
}
