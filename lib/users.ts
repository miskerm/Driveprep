import 'server-only'

import { db } from '@/lib/db'
import { ensureSchema } from '@/lib/schema'
import { normalizeIdentifier, type Identifier } from '@/lib/identifiers'
import type { UserRole, AccountStatus, PaymentStatus } from '@/lib/account-types'

export type AppUser = {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: UserRole
  status: AccountStatus
  paymentStatus: PaymentStatus
  premiumEntitlement: boolean
  premiumActivatedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type AuthUser = AppUser & { passwordHash: string }

function toNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  return Number(value ?? 0)
}

function asRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'user'
}

function asStatus(value: unknown): AccountStatus {
  return value === 'terminated' ? 'terminated' : 'active'
}

function asPaymentStatus(value: unknown): PaymentStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected' ? value : 'unpaid'
}

function rowToUser(row: Record<string, unknown>): AuthUser {
  return {
    id: toNumber(row.id),
    name: String(row.name ?? 'Learner'),
    email: row.email === null || row.email === undefined ? null : String(row.email),
    phone: row.phone === null || row.phone === undefined ? null : String(row.phone),
    passwordHash: String(row.password_hash ?? ''),
    role: asRole(row.role),
    status: asStatus(row.status),
    paymentStatus: asPaymentStatus(row.payment_status),
    premiumEntitlement: toNumber(row.premium_entitlement) === 1,
    premiumActivatedAt: row.premium_activated_at ? String(row.premium_activated_at) : null,
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

const USER_COLUMNS = `id, name, email, phone, password_hash, role, status, payment_status,
  premium_entitlement, premium_activated_at, last_login_at, created_at, updated_at`

export async function getUserById(id: number): Promise<AuthUser | null> {
  await ensureSchema()
  const result = await db().execute({
    sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
    args: [id],
  })
  const row = result.rows[0]
  return row ? rowToUser(row) : null
}

export async function getUserByIdentifier(identifier: Identifier): Promise<AuthUser | null> {
  await ensureSchema()
  const result = await db().execute({
    sql:
      identifier.kind === 'email'
        ? `SELECT ${USER_COLUMNS} FROM users WHERE email = ?`
        : `SELECT ${USER_COLUMNS} FROM users WHERE phone = ?`,
    args: [identifier.value],
  })
  const row = result.rows[0]
  return row ? rowToUser(row) : null
}

export async function createUser(input: {
  name: string
  identifier: Identifier
  passwordHash: string
}): Promise<AppUser> {
  await ensureSchema()
  const now = new Date().toISOString()
  const email = input.identifier.kind === 'email' ? input.identifier.value : null
  const phone = input.identifier.kind === 'phone' ? input.identifier.value : null

  const result = await db().execute({
    sql: `INSERT INTO users (
      name, email, phone, password_hash, role, status, payment_status,
      premium_entitlement, premium_activated_at, last_login_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'user', 'active', 'unpaid', 0, NULL, ?, ?, ?)`,
    args: [input.name, email, phone, input.passwordHash, now, now, now],
  })

  const created = await getUserById(toNumber(result.lastInsertRowid))
  if (!created) throw new Error('The account was created but could not be read back.')
  return created
}

export async function touchLastLogin(id: number) {
  await db().execute({
    sql: 'UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?',
    args: [new Date().toISOString(), new Date().toISOString(), id],
  })
}

export async function listUsers(): Promise<AppUser[]> {
  await ensureSchema()
  const result = await db().execute(
    `SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC, id DESC LIMIT 500`,
  )
  return result.rows.map((row) => {
    const { passwordHash: _passwordHash, ...user } = rowToUser(row)
    return user
  })
}

export async function getDeviceCountsByAccount(): Promise<Map<string, number>> {
  await ensureSchema()
  const result = await db().execute(
    'SELECT email, COUNT(*) AS device_count FROM learner_devices GROUP BY email',
  )
  const counts = new Map<string, number>()
  for (const row of result.rows) {
    counts.set(String(row.email ?? ''), toNumber(row.device_count))
  }
  return counts
}

export async function getRestrictedAccounts(): Promise<Set<string>> {
  await ensureSchema()
  const result = await db().execute(
    'SELECT email FROM learner_access WHERE restricted = 1',
  )
  return new Set(result.rows.map((row) => String(row.email ?? '')))
}

export function configuredAdminIdentifier(): Identifier | null {
  return normalizeIdentifier(process.env.ADMIN_EMAIL)
}

/**
 * Public signup must never create or claim the configured admin identity,
 * even before the admin seed has run.
 */
export function isConfiguredAdminIdentifier(identifier: Identifier) {
  const admin = configuredAdminIdentifier()
  return Boolean(admin && admin.kind === identifier.kind && admin.value === identifier.value)
}

export function isAdmin(user: Pick<AppUser, 'role' | 'status'>) {
  return user.role === 'admin' && user.status === 'active'
}

export function hasPremium(user: Pick<AppUser, 'status' | 'paymentStatus' | 'premiumEntitlement' | 'role'>) {
  if (user.role === 'admin') return user.status === 'active'
  return user.status === 'active' && user.paymentStatus === 'approved' && user.premiumEntitlement
}

export function accountKey(user: Pick<AppUser, 'id' | 'email' | 'phone'>) {
  return user.email || user.phone || `user-${user.id}`
}
