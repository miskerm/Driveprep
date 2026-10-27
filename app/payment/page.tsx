import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { getPaymentConfig } from '@/lib/payment-config'
import { getLatestPaymentForUser } from '@/lib/payments'
import { accountKey } from '@/lib/users'
import { PaymentInstructions } from '@/components/pages/payment-page'
import { PaymentVerifyPage } from '@/components/pages/payment-verify-page'

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
  const identifier = accountKey(user)

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#dbe5e4] bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-5 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 text-sm font-bold text-[#087f78]">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-5 py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <PaymentInstructions
            user={{ name: user.name, email: user.email, phone: user.phone }}
            config={config}
            rejectedReason={latest?.status === 'rejected' ? latest.reason : null}
          />
          <PaymentVerifyPage
            amountLabel={config.amountLabel}
            userIdentifier={identifier}
            hideHeader
          />
        </div>
      </div>
    </main>
  )
}
