import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Clock3, ExternalLink, FileImage, ShieldCheck, XCircle } from 'lucide-react'
import { requireAdmin } from '@/lib/session'
import { getPendingPayments, getPaymentHistory } from '@/lib/payments'
import { getPaymentConfig } from '@/lib/payment-config'
import { approvePaymentAction, rejectPaymentAction } from '@/app/admin/payments/actions'
import type { PaymentRecord, PaymentReviewStatus } from '@/lib/account-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payments | DrivoPrep Admin',
  description: 'Review manual payment submissions and approve premium access.',
}

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

function identifierFor(payment: PaymentRecord) {
  return payment.userEmail || payment.userPhone || `User ${payment.userId}`
}

function StatusBadge({ status }: { status: PaymentReviewStatus }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f5f3] px-2.5 py-1 text-[11px] font-extrabold text-[#06625e]">
        <CheckCircle2 className="size-3.5" /> Approved
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fdeeee] px-2.5 py-1 text-[11px] font-extrabold text-[#b33636]">
        <XCircle className="size-3.5" /> Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3d6] px-2.5 py-1 text-[11px] font-extrabold text-[#9a6a05]">
      <Clock3 className="size-3.5" /> Pending
    </span>
  )
}

const resultMessages: Record<string, { tone: 'success' | 'error' | 'warning'; message: string }> = {
  approved: { tone: 'success', message: 'Payment approved. Premium access is now active for that learner.' },
  rejected: { tone: 'warning', message: 'Payment rejected. The learner can submit a new screenshot.' },
  missing: { tone: 'warning', message: 'That payment was not found or has already been reviewed.' },
  error: { tone: 'error', message: 'The payment could not be updated. Check the server logs and try again.' },
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>
}) {
  await requireAdmin()

  const [params, pending, history, config] = await Promise.all([
    searchParams,
    getPendingPayments(),
    getPaymentHistory(200),
    Promise.resolve(getPaymentConfig()),
  ])

  const approvedCount = history.filter((payment) => payment.status === 'approved').length
  const rejectedCount = history.filter((payment) => payment.status === 'rejected').length
  const result = params.result ? resultMessages[params.result] : null

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#168f82]">Management</p>
          <h1 className="mt-1 text-3xl font-extrabold">Payments</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#607477]">
            Review payment screenshots sent to Telegram, then approve or reject each submission. Premium access is
            granted only after approval.
          </p>
        </div>
        <Link href="/admin/users" className="rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold text-[#087f78]">
          Manage users
        </Link>
      </header>

      {result && (
        <div
          role="status"
          className={`mb-5 rounded-xl border p-4 text-sm font-semibold ${
            result.tone === 'success'
              ? 'border-[#bfe3dc] bg-[#effaf7] text-[#06625e]'
              : result.tone === 'error'
                ? 'border-[#f0c9c9] bg-[#fdf1f1] text-[#a33b3b]'
                : 'border-[#f2dfac] bg-[#fffaf0] text-[#8a6410]'
          }`}
        >
          {result.message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Pending review', String(pending.length), 'Waiting for an admin'],
          ['Approved', String(approvedCount), 'Premium activated'],
          ['Rejected', String(rejectedCount), 'Learner may resubmit'],
          ['Amount', config.amountLabel, `${config.currency} manual payment`],
        ].map(([label, value, caption]) => (
          <div key={label} className="rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#607477]">{label}</p>
            <p className="mt-3 text-2xl font-extrabold">{value}</p>
            <p className="mt-1 text-xs font-semibold text-[#8aa5a1]">{caption}</p>
          </div>
        ))}
      </section>

      {!config.configured && (
        <div className="mt-5 rounded-xl border border-[#f0c9c9] bg-[#fdf1f1] p-4 text-sm font-semibold text-[#a33b3b]">
          Payment configuration is incomplete. Add the required PAYMENT_* variables before accepting new payments.
        </div>
      )}

      <section className="mt-6 rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">Pending payment submissions</h2>
            <p className="text-xs font-semibold text-[#718181]">
              {pending.length} submission{pending.length === 1 ? '' : 's'} waiting for verification
            </p>
          </div>
          <span className="rounded-full bg-[#fff3d6] px-3 py-1 text-xs font-bold text-[#9a6a05]">
            Telegram screenshots
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-8 text-center">
            <ShieldCheck className="mx-auto size-9 text-[#8aa5a1]" />
            <p className="mt-3 font-extrabold text-[#314957]">No payments waiting for review</p>
            <p className="mt-1 text-sm text-[#607477]">New submissions will appear here as soon as Telegram receives them.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {pending.map((payment) => (
              <article key={payment.id} className="rounded-xl border border-[#e3e8e6] bg-[#fbfdfc] p-4 lg:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold">{payment.userName}</h3>
                      <StatusBadge status={payment.status} />
                    </div>
                    <p className="mt-1 break-words text-sm font-semibold text-[#607477]">{identifierFor(payment)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold">{payment.amount.toLocaleString('en-US')} {payment.currency}</p>
                    <p className="text-xs font-semibold text-[#718181]">Submitted {formatDate(payment.submittedAt)}</p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 rounded-lg bg-white p-4 text-sm ring-1 ring-[#edf0ef] sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-[#8aa5a1]">Reference</dt>
                    <dd className="mt-1 break-all font-extrabold">{payment.reference}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-[#8aa5a1]">Receipt file</dt>
                    <dd className="mt-1 break-words font-semibold text-[#314957]">{payment.receiptName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-[#8aa5a1]">Telegram message</dt>
                    <dd className="mt-1 font-semibold text-[#314957]">{payment.telegramMessageId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-[#8aa5a1]">Screenshot</dt>
                    <dd className="mt-1">
                      {payment.telegramFileId ? (
                        <a
                          href={`/api/admin/payments/${payment.id}/screenshot`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-[#087f78] underline underline-offset-4"
                        >
                          <FileImage className="size-4" />
                          View screenshot
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="font-semibold text-[#8aa5a1]">No file reference</span>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
                  <form action={approvePaymentAction}>
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#087f78] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#066a64]"
                    >
                      <CheckCircle2 className="size-4" />
                      Approve &amp; activate premium
                    </button>
                  </form>

                  <form action={rejectPaymentAction} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <div className="flex-1">
                      <label htmlFor={`reject-reason-${payment.id}`} className="text-xs font-bold text-[#607477]">
                        Rejection reason (optional)
                      </label>
                      <input
                        id={`reject-reason-${payment.id}`}
                        name="reason"
                        maxLength={500}
                        placeholder="e.g. Amount not received or screenshot unreadable"
                        className="mt-1 w-full rounded-lg border border-[#cbd9d7] px-3 py-2.5 text-sm outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9a5a5] bg-white px-4 py-2.5 text-sm font-bold text-[#b33636] hover:bg-[#fdeeee]"
                    >
                      <XCircle className="size-4" />
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">Payment history</h2>
            <p className="text-xs font-semibold text-[#718181]">Latest {history.length} submission{history.length === 1 ? '' : 's'}</p>
          </div>
          <Link href="/admin/users" className="text-sm font-bold text-[#087f78] underline underline-offset-4">
            View account status history
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e3e8e6] text-[#607477]">
                <th className="p-3">Learner</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Reviewed</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Proof</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center font-semibold text-[#718181]">
                    No payment submissions yet.
                  </td>
                </tr>
              ) : (
                history.map((payment) => (
                  <tr key={payment.id} className="border-b border-[#edf0ef] align-top last:border-0">
                    <td className="p-3">
                      <p className="font-bold">{payment.userName}</p>
                      <p className="break-words text-xs font-semibold text-[#718181]">{identifierFor(payment)}</p>
                    </td>
                    <td className="p-3 break-all font-semibold text-[#314957]">{payment.reference}</td>
                    <td className="p-3 font-bold">{payment.amount.toLocaleString('en-US')} {payment.currency}</td>
                    <td className="p-3"><StatusBadge status={payment.status} /></td>
                    <td className="p-3 text-xs font-semibold text-[#607477]">{formatDate(payment.submittedAt)}</td>
                    <td className="p-3 text-xs font-semibold text-[#607477]">{formatDate(payment.reviewedAt)}</td>
                    <td className="p-3 max-w-[220px] break-words text-xs text-[#607477]">{payment.reason || '—'}</td>
                    <td className="p-3">
                      {payment.telegramFileId ? (
                        <a
                          href={`/api/admin/payments/${payment.id}/screenshot`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#087f78] underline underline-offset-4"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-[#8aa5a1]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
