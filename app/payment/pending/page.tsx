import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getPaymentConfig } from '@/lib/payment-config'
import { getLatestPaymentForUser } from '@/lib/payments'
import { PaymentPendingPage } from '@/components/pages/payment-pending-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payment under review | DrivoPrep',
  description: 'Your payment proof is waiting for administrator verification.',
}

export default async function PaymentPendingRoute() {
  const user = await requireUser('/payment/pending')

  if (user.status === 'terminated') redirect('/account/terminated')
  if (user.paymentStatus === 'approved' && user.premiumEntitlement) redirect('/dashboard')

  const payment = await getLatestPaymentForUser(user.id)
  if (!payment && user.paymentStatus === 'unpaid') redirect('/payment')

  const config = getPaymentConfig()

  return (
    <PaymentPendingPage
      user={{ name: user.name, email: user.email, phone: user.phone }}
      payment={payment}
      amountLabel={config.amountLabel}
    />
  )
}
