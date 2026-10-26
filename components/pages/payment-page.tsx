import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Banknote, Clock3, CreditCard, ShieldCheck } from 'lucide-react'
import type { PaymentConfig } from '@/lib/payment-config'

export type PaymentPageUser = {
  name: string
  email: string | null
  phone: string | null
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#edf0ef] py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-semibold text-[#607477]">{label}</dt>
      <dd className="break-words text-base font-extrabold text-[#142238]">{value || '—'}</dd>
    </div>
  )
}

export function PaymentInstructions({
  user,
  config,
  rejectedReason,
}: {
  user: PaymentPageUser
  config: PaymentConfig
  rejectedReason: string | null
}) {
  const identifier = user.email || user.phone || '—'

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#dbe5e4] bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-5 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 text-sm font-bold text-[#087f78]">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <span className="hidden items-center gap-2 text-sm font-bold text-[#607477] sm:flex">
            <ShieldCheck className="size-5 text-[#168f82]" />
            Secure manual verification
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-5 py-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-2xl border border-[#d8e2e0] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#168f82]">Premium access</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Complete your payment</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#607477]">
              Pay the amount below using your banking app, then upload a screenshot of the receipt. Your premium
              access is activated after an administrator verifies the payment.
            </p>

            {rejectedReason && (
              <div role="alert" className="mt-5 rounded-xl border border-[#f0c9c9] bg-[#fdf1f1] p-4 text-sm text-[#a33b3b]">
                <p className="font-extrabold">Your last payment was not approved.</p>
                <p className="mt-1 leading-6">{rejectedReason}</p>
                <p className="mt-1 leading-6">You can submit a new screenshot below.</p>
              </div>
            )}

            <div className="mt-7 rounded-xl border border-[#f2dfac] bg-[#fffaf0] p-5">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#9a6a05]">
                <Banknote className="size-5" />
                Amount to pay
              </p>
              <p className="mt-2 text-4xl font-extrabold text-[#142238]">{config.amountLabel}</p>
              <p className="mt-2 text-sm font-semibold text-[#8a6410]">Pay exactly this amount for one premium account.</p>
            </div>

            <h2 className="mt-8 text-xl font-extrabold">Bank transfer details</h2>
            {config.configured ? (
              <dl className="mt-3 rounded-xl border border-[#e3e8e6] bg-[#f8fbfa] px-5 py-2">
                <DetailRow label="Bank" value={config.bankName} />
                <DetailRow label="Account name" value={config.accountName} />
                <DetailRow label="Account number" value={config.accountNumber} />
                <DetailRow label="Amount" value={config.amountLabel} />
              </dl>
            ) : (
              <div className="mt-3 rounded-xl border border-[#f0c9c9] bg-[#fdf1f1] p-4 text-sm font-semibold text-[#a33b3b]">
                Payment instructions are not configured yet. Please contact support before sending money.
              </div>
            )}

            <div className="mt-5 rounded-xl border border-[#d5e7e3] bg-[#effafa] p-4 text-sm leading-6 text-[#3d5153]">
              <p className="font-extrabold text-[#087f78]">Use this payment reference</p>
              <p className="mt-1">
                {config.referenceNote} Your registered account is <strong>{identifier}</strong>.
              </p>
            </div>

            <Link
              href={config.configured ? '/payment/verify' : '/dashboard'}
              aria-disabled={!config.configured}
              className={`mt-7 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-base font-bold text-white ${
                config.configured ? 'bg-[#087f78] hover:bg-[#066a64]' : 'pointer-events-none bg-[#9bb8b5]'
              }`}
            >
              <CreditCard className="size-5" />
              I Have Paid — Upload Screenshot
            </Link>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Clock3 className="size-5 text-[#168f82]" />
                What happens next
              </h2>
              <ol className="mt-4 space-y-4 text-sm leading-6 text-[#3d5153]">
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6f5f3] text-xs font-extrabold text-[#087f78]">1</span>
                  Pay the exact amount to the bank account shown.
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6f5f3] text-xs font-extrabold text-[#087f78]">2</span>
                  Upload a clear screenshot of the payment confirmation. It is sent to our Telegram bot for review and is not stored in our database.
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6f5f3] text-xs font-extrabold text-[#087f78]">3</span>
                  An administrator verifies the screenshot. Until then your payment status stays pending.
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6f5f3] text-xs font-extrabold text-[#087f78]">4</span>
                  Once approved, Study, Practice, Full Mock Tests, and Quick Quizzes unlock automatically.
                </li>
              </ol>
            </section>

            <section className="rounded-2xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <BadgeCheck className="size-5 text-[#168f82]" />
                Signed in as
              </h2>
              <p className="mt-3 text-base font-extrabold">{user.name}</p>
              <p className="mt-1 break-words text-sm font-semibold text-[#607477]">{identifier}</p>
              <p className="mt-4 text-xs leading-5 text-[#718181]">
                Premium access is personal to this account. Sharing an account or using more than one device may
                restrict access.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
