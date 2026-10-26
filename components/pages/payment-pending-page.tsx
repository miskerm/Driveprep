import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock3, Hourglass, ShieldAlert } from 'lucide-react'
import type { PaymentRecord } from '@/lib/account-types'
import { PaymentStatusRefresh } from '@/components/pages/payment-status-refresh'

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PaymentPendingPage({
  user,
  payment,
  amountLabel,
}: {
  user: { name: string; email: string | null; phone: string | null }
  payment: PaymentRecord | null
  amountLabel: string
}) {
  const rejected = payment?.status === 'rejected'
  const identifier = user.email || user.phone || '—'

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#dbe5e4] bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-5 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 text-sm font-bold text-[#087f78]">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <span className="text-sm font-bold text-[#607477]">DrivoPrep payment</span>
        </div>
      </div>

      <div className="mx-auto max-w-[760px] px-5 py-10 lg:py-14">
        <section className="rounded-2xl border border-[#d8e2e0] bg-white p-6 text-center shadow-sm sm:p-9">
          <span
            className={`mx-auto grid size-16 place-items-center rounded-2xl ${
              rejected ? 'bg-[#fdf1f1] text-[#b33636]' : 'bg-[#fff8e6] text-[#a97608]'
            }`}
          >
            {rejected ? <ShieldAlert className="size-8" /> : <Hourglass className="size-8" />}
          </span>
          <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">
            {rejected ? 'Payment not approved' : 'Payment under review'}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#607477]">
            {rejected
              ? 'An administrator reviewed your screenshot and could not verify the payment. Read the reason below, then submit a new screenshot.'
              : 'Your screenshot was received. An administrator will verify it before premium access is activated. This page updates automatically.'}
          </p>

          {rejected && payment?.reason && (
            <div role="alert" className="mx-auto mt-5 max-w-xl rounded-xl border border-[#f0c9c9] bg-[#fdf1f1] p-4 text-left text-sm text-[#a33b3b]">
              <p className="font-extrabold">Reason</p>
              <p className="mt-1 leading-6">{payment.reason}</p>
            </div>
          )}

          <dl className="mx-auto mt-7 max-w-xl rounded-xl border border-[#e3e8e6] bg-[#f8fbfa] px-5 py-2 text-left">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0ef] py-3">
              <dt className="text-sm font-semibold text-[#607477]">Account</dt>
              <dd className="break-words text-sm font-extrabold">{identifier}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0ef] py-3">
              <dt className="text-sm font-semibold text-[#607477]">Amount</dt>
              <dd className="text-sm font-extrabold">{amountLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0ef] py-3">
              <dt className="text-sm font-semibold text-[#607477]">Reference</dt>
              <dd className="break-all text-sm font-extrabold">{payment?.reference || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0ef] py-3">
              <dt className="text-sm font-semibold text-[#607477]">Submitted</dt>
              <dd className="text-sm font-extrabold">{formatDate(payment?.submittedAt ?? null)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-sm font-semibold text-[#607477]">Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                    rejected ? 'bg-[#fdeeee] text-[#b33636]' : 'bg-[#fff3d6] text-[#9a6a05]'
                  }`}
                >
                  {rejected ? <ShieldAlert className="size-3.5" /> : <Clock3 className="size-3.5" />}
                  {rejected ? 'Rejected' : 'Pending verification'}
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {rejected ? (
              <Link href="/payment/verify" className="rounded-lg bg-[#087f78] px-5 py-3 font-bold text-white">
                Upload a new screenshot
              </Link>
            ) : (
              <PaymentStatusRefresh />
            )}
            <Link href="/dashboard" className="rounded-lg border border-[#bfcecb] bg-white px-5 py-3 font-bold text-[#087f78]">
              Back to dashboard
            </Link>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Screenshot received', text: 'Your proof was sent to the Telegram review bot.', done: true },
            { title: 'Admin verification', text: 'An administrator checks the amount and reference.', done: false },
            { title: 'Premium unlocked', text: 'Study, Practice, Mock Tests, and Quizzes open.', done: false },
          ].map((step) => (
            <div key={step.title} className="rounded-xl border border-[#dfe7e5] bg-white p-4 shadow-sm">
              <span className={`grid size-8 place-items-center rounded-full ${step.done ? 'bg-[#e6f5f3] text-[#087f78]' : 'bg-[#f3f6f5] text-[#8aa5a1]'}`}>
                {step.done ? <CheckCircle2 className="size-5" /> : <Clock3 className="size-5" />}
              </span>
              <p className="mt-3 text-sm font-extrabold">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#718181]">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
