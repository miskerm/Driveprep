'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { AccountStatusButton } from '@/components/admin/account-status-button'
import { PremiumAccessButton } from '@/components/admin/premium-access-button'
import { isAdmin, hasPremium, accountKey } from '@/lib/users-client'
import type { AppUser } from '@/lib/users-client'
import type { LearnerAccess } from '@/lib/access-types'
import { DEVICE_FLAG_THRESHOLD } from '@/lib/access-types'

interface UsersTableProps {
  users: AppUser[]
  trackedLearners: LearnerAccess[]
  pendingPaymentUserIds: Set<number>
}

function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function paymentBadge(status: string) {
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

function accountBadge(status: string) {
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

export function UsersTable({
  users,
  trackedLearners,
  pendingPaymentUserIds,
}: UsersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  // Auto-select the first non-admin learner user on mount
  useEffect(() => {
    const firstLearner = users.find((user) => !isAdmin(user))
    if (firstLearner) {
      setSelectedUserId(firstLearner.id)
    }
  }, [users])

  const trackedByKey = new Map(trackedLearners.map((learner) => [learner.email, learner]))
  const learnerUsers = users.filter((user) => !isAdmin(user))

  return (
    <section className="mt-6 rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
            <Users className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">Registered users</h2>
            <p className="text-xs font-semibold text-[#718181]">
              {users.length} account{users.length === 1 ? '' : 's'} · {learnerUsers.filter(hasPremium).length} premium · {pendingPaymentUserIds.size} pending payment{pendingPaymentUserIds.size === 1 ? '' : 's'}
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
                const selected = selectedUserId === user.id
                const isLearner = !admin

                const baseClasses = `border-b border-[#edf0ef] align-top last:border-0 transition-colors cursor-pointer ${selected ? 'bg-[#e6f5f3]' : user.status === 'terminated' ? 'bg-[#fff8f8]' : restricted ? 'bg-[#fffbf2]' : ''}`

                return (
                  <tr
                    key={user.id}
                    className={baseClasses}
                    onClick={() => {
                      if (isLearner) setSelectedUserId(user.id)
                    }}
                  >
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#142238]">{user.name}</p>
                        {admin && (
                          <span className="rounded-full bg-[#142238] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">Admin</span>
                        )}
                        {selected && isLearner && (
                          <span className="rounded-full bg-[#087f78] px-2 py-0.5 text-[10px] font-bold text-white">Selected</span>
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
  )
}
