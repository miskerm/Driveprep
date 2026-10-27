import Link from 'next/link'
import type { Metadata } from 'next'
import { History, ShieldAlert } from 'lucide-react'
import { requireAdmin } from '@/lib/session'
import { listUsers, hasPremium, isAdmin } from '@/lib/users'
import { getTrackedLearners } from '@/lib/db'
import { getPendingPayments } from '@/lib/payments'
import { listAccountEvents } from '@/lib/account-admin'
import { DEVICE_FLAG_THRESHOLD } from '@/lib/access-types'
import { UsersTable } from '@/components/admin/users-table'
import type { PaymentStatus, AccountStatus } from '@/lib/account-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Users | DrivoPrep Admin',
  description: 'Manage learner accounts, payment status, and premium access.',
}

function formatDateTime(value: string) {
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

const eventLabels: Record<string, string> = {
  payment_submitted: 'Payment submitted',
  payment_approved: 'Payment approved',
  payment_rejected: 'Payment rejected',
  account_terminated: 'Account terminated',
  account_activated: 'Account activated',
  premium_restricted: 'Premium restricted',
  premium_restored: 'Premium restored',
}

const resultMessages: Record<string, { tone: 'success' | 'error' | 'warning'; message: string }> = {
  terminated: { tone: 'warning', message: 'Account terminated. Premium access is blocked immediately.' },
  activated: { tone: 'success', message: 'Account activated.' },
  'premium-restricted': { tone: 'warning', message: 'Premium access was restricted for that account.' },
  'premium-restored': { tone: 'success', message: 'Premium access was restored for that account.' },
  error: { tone: 'error', message: 'The account could not be updated. Check the server logs and try again.' },
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>
}) {
  await requireAdmin()

  const [params, users, trackedLearners, pendingPayments, events] = await Promise.all([
    searchParams,
    listUsers(),
    getTrackedLearners(),
    getPendingPayments(),
    listAccountEvents(80),
  ])

  const learnerUsers = users.filter((user) => !isAdmin(user))
  const premiumCount = learnerUsers.filter(hasPremium).length
  const terminatedCount = learnerUsers.filter((user) => user.status === 'terminated').length
  const result = params.result ? resultMessages[params.result] : null

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#168f82]">Management</p>
          <h1 className="mt-1 text-3xl font-extrabold">Users</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#607477]">
            Registered learners, their payment and account status, and the devices they use. Account and premium
            changes take effect on the learner&apos;s next request, even if they already have a session.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/payments" className="rounded-lg bg-[#087f78] px-4 py-2.5 text-sm font-bold text-white">
            Review payments {pendingPayments.length > 0 ? `(${pendingPayments.length})` : ''}
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold text-[#087f78]">
            View learner dashboard
          </Link>
        </div>
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
          ['Registered users', String(learnerUsers.length), 'Learner accounts'],
          ['Premium active', String(premiumCount), 'Approved & entitled'],
          ['Pending payments', String(pendingPayments.length), 'Waiting for review'],
          ['Terminated', String(terminatedCount), 'Blocked immediately'],
        ].map(([label, value, caption]) => (
          <div key={label} className="rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#607477]">{label}</p>
            <p className="mt-3 text-2xl font-extrabold">{value}</p>
            <p className="mt-1 text-xs font-semibold text-[#8aa5a1]">{caption}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d5e7e3] bg-[#effafa] p-4 text-xs leading-5 text-[#3d5153]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#087f78]" />
        <p>
          Terminating an account blocks premium content immediately, even with an existing session. Restricting
          premium keeps the account active but removes access. Admin accounts are protected and cannot be terminated
          from this screen.
        </p>
      </div>

      <UsersTable
        users={users}
        trackedLearners={trackedLearners}
        pendingPaymentUserIds={new Set(pendingPayments.map((p) => p.userId))}
      />

      <section className="mt-6 rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
              <History className="size-4" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold">Account &amp; payment status history</h2>
              <p className="text-xs font-semibold text-[#718181]">Latest {events.length} change{events.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <Link href="/admin/payments" className="text-sm font-bold text-[#087f78] underline underline-offset-4">
            Open payment history
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-6 text-center text-sm font-semibold text-[#718181]">
            No status changes have been recorded yet.
          </p>
        ) : (
          <ol className="mt-5 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex flex-col gap-2 rounded-xl border border-[#edf0ef] bg-[#fbfdfc] p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#142238]">
                    {eventLabels[event.action] || event.action}
                    <span className="ml-2 font-semibold text-[#607477]">{event.userName}</span>
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-[#607477]">{event.detail}</p>
                </div>
                <p className="shrink-0 text-xs font-semibold text-[#8aa5a1]">{formatDateTime(event.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Content tools</h2>
          <p className="mt-1 text-sm text-[#607477]">Publish study material and build assessments from the side panel.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/modules" className="rounded-lg bg-[#168f82] px-4 py-2.5 text-sm font-bold text-white">Add Study Module</Link>
            <Link href="/admin/practice" className="rounded-lg bg-[#1784c0] px-4 py-2.5 text-sm font-bold text-white">Add Practice</Link>
            <Link href="/admin/mock-tests" className="rounded-lg bg-[#ef6a57] px-4 py-2.5 text-sm font-bold text-white">Add Mock Test</Link>
            <Link href="/admin/quizzes" className="rounded-lg bg-[#d79a0b] px-4 py-2.5 text-sm font-bold text-white">Add Quiz</Link>
          </div>
        </div>
        <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Device tracking</h2>
          <p className="mt-1 text-sm text-[#607477]">
            {trackedLearners.length === 0
              ? 'No learner devices have been registered yet. Tracking starts when a learner opens the dashboard.'
              : `${trackedLearners.length} tracked account${trackedLearners.length === 1 ? '' : 's'} across ${trackedLearners.reduce((total, learner) => total + learner.deviceCount, 0)} device${trackedLearners.reduce((total, learner) => total + learner.deviceCount, 0) === 1 ? '' : 's'}. Accounts with ${DEVICE_FLAG_THRESHOLD}+ devices are flagged for review.`}
          </p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-lg border border-[#bfcecb] px-4 py-2.5 text-sm font-bold text-[#087f78]">
            Open learner view
          </Link>
        </div>
      </section>
    </main>
  )
}
