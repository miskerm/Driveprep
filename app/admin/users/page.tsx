import Link from 'next/link'
import type { Metadata } from 'next'
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { requireAdmin } from '@/lib/session'
import { listUsers, hasPremium, isAdmin, accountKey } from '@/lib/users'
import { getTrackedLearners } from '@/lib/db'
import { getPendingPayments } from '@/lib/payments'
import { listAccountEvents } from '@/lib/account-admin'
import { DEVICE_FLAG_THRESHOLD } from '@/lib/access-types'
import { AccountStatusButton } from '@/components/admin/account-status-button'
import { PremiumAccessButton } from '@/components/admin/premium-access-button'
import type { PaymentStatus, AccountStatus } from '@/lib/account-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Users | DrivoPrep Admin',
  description: 'Manage learner accounts, payment status, and premium access.',
}

function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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

function paymentBadge(status: PaymentStatus) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f5f3] px-2.5 py-1 text-[11px] font-extrabold text-[#06625e]">
        <CheckCircle2 className="size-3.5" /> Approved
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3d6] px-2.5 py-1 text-[11px] font-extrabold text-[#9a6a05]">
        <Clock3 className="size-3.5" /> Pending
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fdeeee] px-2.5 py-1 text-[11px] font-extrabold text-[#b33636]">
        <ShieldAlert className="size-3.5" /> Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f6f5] px-2.5 py-1 text-[11px] font-extrabold text-[#607477]">
      <CreditCard className="size-3.5" /> Unpaid
    </span>
  )
}

function accountBadge(status: AccountStatus) {
  return status === 'terminated' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fdeeee] px-2.5 py-1 text-[11px] font-extrabold text-[#b33636]">
      <UserX className="size-3.5" /> Terminated
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f5f3] px-2.5 py-1 text-[11px] font-extrabold text-[#06625e]">
      <UserCheck className="size-3.5" /> Active
    </span>
  )
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

  const trackedByKey = new Map(trackedLearners.map((learner) => [learner.email, learner]))
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

      <section className="mt-6 rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
              <Users className="size-4" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold">Registered users</h2>
              <p className="text-xs font-semibold text-[#718181]">
                {users.length} account{users.length === 1 ? '' : 's'} · {premiumCount} premium · {pendingPayments.length} pending payment{pendingPayments.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#e6f5f3] px-3 py-1 text-xs font-bold text-[#06625e]">
            {users.length} shown
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e3e8e6] text-[#607477]">
                <th className="p-3">Learner</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Registered</th>
                <th className="p-3">Account</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Premium</th>
                <th className="p-3">Devices</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center font-semibold text-[#718181]">
                    No accounts yet. Signup will create the first learner account.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const admin = isAdmin(user)
                  const premium = hasPremium(user)
                  const key = accountKey(user)
                  const tracked = trackedByKey.get(key)
                  const deviceCount = tracked?.deviceCount ?? 0
                  const flagged = deviceCount >= DEVICE_FLAG_THRESHOLD
                  const restricted = Boolean(tracked?.restricted)

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-[#edf0ef] align-top last:border-0 ${
                        user.status === 'terminated' ? 'bg-[#fff8f8]' : restricted ? 'bg-[#fffbf2]' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-[#142238]">{user.name}</p>
                          {admin && (
                            <span className="rounded-full bg-[#142238] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">Admin</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#8aa5a1]">User #{user.id}</p>
                      </td>
                      <td className="p-3">
                        <p className="break-words font-semibold text-[#314957]">{user.email || user.phone || '—'}</p>
                        {user.email && user.phone && <p className="mt-0.5 text-xs text-[#718181]">{user.phone}</p>}
                      </td>
                      <td className="p-3 text-xs font-semibold text-[#607477]">{formatDate(user.createdAt)}</td>
                      <td className="p-3">{accountBadge(user.status)}</td>
                      <td className="p-3">{paymentBadge(user.paymentStatus)}</td>
                      <td className="p-3">
                        {premium ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f5f3] px-2.5 py-1 text-[11px] font-extrabold text-[#06625e]">
                            <ShieldCheck className="size-3.5" /> Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#f3f6f5] px-2.5 py-1 text-[11px] font-extrabold text-[#607477]">Locked</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${flagged ? 'bg-[#fff3d6] text-[#9a6a05]' : 'bg-[#f3f6f5] text-[#3d5153]'}`}>
                            <Smartphone className="size-3" />
                            {deviceCount} device{deviceCount === 1 ? '' : 's'}
                          </span>
                          {restricted && (
                            <span className="rounded-full bg-[#fdeeee] px-2 py-1 text-[10px] font-bold text-[#b33636]">Restricted</span>
                          )}
                          {!restricted && flagged && (
                            <span className="text-[10px] font-bold text-[#9a6a05]">{DEVICE_FLAG_THRESHOLD}+ devices</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {admin ? (
                          <span className="text-xs font-semibold text-[#8aa5a1]">Protected</span>
                        ) : (
                          <div className="flex flex-col items-start gap-2">
                            <AccountStatusButton userId={user.id} name={user.name} status={user.status} />
                            <PremiumAccessButton
                              userId={user.id}
                              name={user.name}
                              restricted={restricted}
                              flagged={flagged}
                            />
                            {user.paymentStatus === 'pending' && (
                              <Link href="/admin/payments" className="text-xs font-bold text-[#087f78] underline underline-offset-4">
                                Review payment
                              </Link>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

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
