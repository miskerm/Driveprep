import 'server-only'

import { db } from '@/lib/db'
import { ensureSchema } from '@/lib/schema'
import type { AccountEvent } from '@/lib/account-types'
import { getUserById, type AppUser } from '@/lib/users'

function toNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  return Number(value ?? 0)
}

export async function recordAccountEvent(input: {
  userId: number
  actorId: number | null
  action: string
  detail: string
}) {
  await db().execute({
    sql: `INSERT INTO account_events (id, user_id, actor_id, action, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      input.userId,
      input.actorId,
      input.action.slice(0, 80),
      input.detail.slice(0, 1000),
      new Date().toISOString(),
    ],
  })
}

export async function listAccountEvents(limit = 60): Promise<AccountEvent[]> {
  await ensureSchema()
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 300)
  const result = await db().execute(
    `SELECT e.id, e.user_id, e.actor_id, e.action, e.detail, e.created_at,
      coalesce(u.name, 'Unknown user') AS user_name
    FROM account_events e
    LEFT JOIN users u ON u.id = e.user_id
    ORDER BY e.created_at DESC
    LIMIT ${safeLimit}`,
  )

  return result.rows.map((row) => ({
    id: String(row.id ?? ''),
    userId: toNumber(row.user_id),
    userName: String(row.user_name ?? ''),
    actorId: row.actor_id === null || row.actor_id === undefined ? null : toNumber(row.actor_id),
    action: String(row.action ?? ''),
    detail: String(row.detail ?? ''),
    createdAt: String(row.created_at ?? ''),
  }))
}

export async function setUserAccountStatus(
  userId: number,
  status: 'active' | 'terminated',
  actor: AppUser,
): Promise<{ ok: boolean; message: string }> {
  await ensureSchema()

  const target = await getUserById(userId)
  if (!target) return { ok: false, message: 'That account no longer exists.' }
  if (target.role === 'admin') {
    return { ok: false, message: 'Admin accounts cannot be deactivated from this screen.' }
  }
  if (target.status === status) {
    return { ok: true, message: `The account is already ${status}.` }
  }

  const now = new Date().toISOString()
  await db().batch(
    [
      {
        sql: 'UPDATE users SET status = ?, updated_at = ? WHERE id = ?',
        args: [status, now, userId],
      },
      {
        sql: `INSERT INTO account_events (id, user_id, actor_id, action, detail, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          userId,
          actor.id,
          status === 'terminated' ? 'account_terminated' : 'account_activated',
          status === 'terminated'
            ? 'Account terminated by an administrator. Premium content access is blocked immediately.'
            : 'Account reactivated by an administrator.',
          now,
        ],
      },
    ],
    'write',
  )

  return { ok: true, message: status === 'terminated' ? 'Account terminated.' : 'Account activated.' }
}
