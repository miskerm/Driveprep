import 'server-only'

import { db } from '@/lib/db'
import { ensureSchema } from '@/lib/schema'
import type { PaymentRecord, PaymentReviewStatus } from '@/lib/account-types'
import { accountKey, getUserById, type AppUser } from '@/lib/users'

function toNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  return Number(value ?? 0)
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined) return null
  const number = toNumber(value)
  return Number.isFinite(number) ? number : null
}

function asReviewStatus(value: unknown): PaymentReviewStatus {
  return value === 'approved' || value === 'rejected' ? value : 'pending'
}

function rowToPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id ?? ''),
    userId: toNumber(row.user_id),
    userName: String(row.user_name ?? ''),
    userEmail: row.user_email === null || row.user_email === undefined ? null : String(row.user_email),
    userPhone: row.user_phone === null || row.user_phone === undefined ? null : String(row.user_phone),
    amount: toNumber(row.amount),
    currency: (process.env.PAYMENT_CURRENCY || 'ETB').trim(),
    reference: String(row.reference ?? ''),
    status: asReviewStatus(row.status),
    submittedAt: String(row.submitted_at ?? ''),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewedBy: nullableNumber(row.reviewed_by),
    reason: row.reason ? String(row.reason) : null,
    receiptName: String(row.receipt_name ?? ''),
    telegramMessageId: nullableNumber(row.telegram_message_id),
    telegramFileId: row.telegram_file_id ? String(row.telegram_file_id) : null,
    telegramFileUniqueId: row.telegram_file_unique_id ? String(row.telegram_file_unique_id) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

const PAYMENT_COLUMNS = `id, user_id, user_name, user_email, user_phone, amount, reference, status,
  submitted_at, reviewed_at, reviewed_by, reason, receipt_name, telegram_message_id,
  telegram_file_id, telegram_file_unique_id, created_at, updated_at`

export class DuplicatePaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DuplicatePaymentError'
  }
}

export async function getLatestPaymentForUser(userId: number): Promise<PaymentRecord | null> {
  await ensureSchema()
  const result = await db().execute({
    sql: `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1`,
    args: [userId],
  })
  const row = result.rows[0]
  return row ? rowToPayment(row) : null
}

export async function getPaymentById(id: string): Promise<PaymentRecord | null> {
  await ensureSchema()
  const result = await db().execute({
    sql: `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE id = ?`,
    args: [id],
  })
  const row = result.rows[0]
  return row ? rowToPayment(row) : null
}

export async function getPendingPayments(): Promise<PaymentRecord[]> {
  await ensureSchema()
  const result = await db().execute(
    `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE status = 'pending' ORDER BY submitted_at ASC`,
  )
  return result.rows.map(rowToPayment)
}

export async function getPaymentHistory(limit = 200): Promise<PaymentRecord[]> {
  await ensureSchema()
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500)
  const result = await db().execute(
    `SELECT ${PAYMENT_COLUMNS} FROM payments ORDER BY submitted_at DESC LIMIT ${safeLimit}`,
  )
  return result.rows.map(rowToPayment)
}

export async function createPaymentRecord(input: {
  user: AppUser
  amount: number
  reference: string
  receiptName: string
  telegramMessageId: number
  telegramFileId: string | null
  telegramFileUniqueId: string | null
}): Promise<PaymentRecord> {
  await ensureSchema()

  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const identifier = input.user.email || input.user.phone || `user-${input.user.id}`

  const results = await db().batch(
    [
      {
        sql: `INSERT INTO payments (
          id, user_id, user_name, user_email, user_phone, plan, amount, reference, status,
          submitted_at, reviewed_at, reviewed_by, reason, receipt_name, receipt_url,
          telegram_message_id, telegram_file_id, telegram_file_unique_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'premium_1000', ?, ?, 'pending', ?, NULL, NULL, NULL, ?, NULL, ?, ?, ?, ?, ?)`,
        args: [
          id,
          input.user.id,
          input.user.name,
          input.user.email,
          input.user.phone,
          input.amount,
          input.reference,
          now,
          input.receiptName,
          input.telegramMessageId,
          input.telegramFileId,
          input.telegramFileUniqueId,
          now,
          now,
        ],
      },
      {
        sql: `UPDATE users SET payment_status = 'pending', updated_at = ?
          WHERE id = ? AND status = 'active' AND payment_status IN ('unpaid', 'rejected')`,
        args: [now, input.user.id],
      },
      {
        sql: `UPDATE learner_access SET plan = 'premium_1000', updated_at = ? WHERE email = ?`,
        args: [now, identifier],
      },
      {
        sql: `INSERT INTO account_events (id, user_id, actor_id, action, detail, created_at)
          VALUES (?, ?, ?, 'payment_submitted', ?, ?)`,
        args: [
          crypto.randomUUID(),
          input.user.id,
          input.user.id,
          `Payment proof submitted (reference ${input.reference}, ${input.amount} ${process.env.PAYMENT_CURRENCY || 'ETB'}). Telegram message ${input.telegramMessageId}.`,
          now,
        ],
      },
    ],
    'write',
  )

  if (results[1]?.rowsAffected === 0) {
    // Lost a race with another submission: remove this orphan record so the
    // existing pending/approved payment stays the single source of truth.
    await db().execute({ sql: 'DELETE FROM payments WHERE id = ?', args: [id] })
    throw new DuplicatePaymentError('A payment submission is already pending or approved.')
  }

  const created = await getPaymentById(id)
  if (!created) throw new Error('The payment submission could not be read back.')
  return created
}

export async function approvePayment(paymentId: string, adminId: number): Promise<PaymentRecord | null> {
  await ensureSchema()

  const payment = await getPaymentById(paymentId)
  if (!payment || payment.status !== 'pending') return null

  const user = await getUserById(payment.userId)
  if (!user) return null

  const now = new Date().toISOString()
  const key = accountKey(user)

  const results = await db().batch(
    [
      {
        sql: `UPDATE payments SET status = 'approved', reviewed_at = ?, reviewed_by = ?,
          reason = NULL, updated_at = ? WHERE id = ? AND status = 'pending'`,
        args: [now, adminId, now, paymentId],
      },
      {
        sql: `UPDATE users SET payment_status = 'approved', premium_entitlement = 1,
          premium_activated_at = ?, updated_at = ? WHERE id = ?`,
        args: [now, now, payment.userId],
      },
      {
        sql: `UPDATE learner_access SET plan = 'premium_1000', updated_at = ? WHERE email = ?`,
        args: [now, key],
      },
      {
        sql: `INSERT INTO account_events (id, user_id, actor_id, action, detail, created_at)
          VALUES (?, ?, ?, 'payment_approved', ?, ?)`,
        args: [
          crypto.randomUUID(),
          payment.userId,
          adminId,
          `Payment approved (reference ${payment.reference}, ${payment.amount} ${payment.currency}). Premium access activated.`,
          now,
        ],
      },
    ],
    'write',
  )

  if (results[0]?.rowsAffected === 0) return null

  return getPaymentById(paymentId)
}

export async function rejectPayment(
  paymentId: string,
  adminId: number,
  reason: string,
): Promise<PaymentRecord | null> {
  await ensureSchema()

  const payment = await getPaymentById(paymentId)
  if (!payment || payment.status !== 'pending') return null

  const user = await getUserById(payment.userId)
  if (!user) return null

  const now = new Date().toISOString()
  const safeReason = reason.trim().slice(0, 500) || 'The payment could not be verified.'
  const key = accountKey(user)

  const results = await db().batch(
    [
      {
        sql: `UPDATE payments SET status = 'rejected', reviewed_at = ?, reviewed_by = ?,
          reason = ?, updated_at = ? WHERE id = ? AND status = 'pending'`,
        args: [now, adminId, safeReason, now, paymentId],
      },
      {
        sql: `UPDATE users SET payment_status = 'rejected', premium_entitlement = 0,
          updated_at = ? WHERE id = ?`,
        args: [now, payment.userId],
      },
      {
        sql: `UPDATE learner_access SET plan = 'free', updated_at = ? WHERE email = ?`,
        args: [now, key],
      },
      {
        sql: `INSERT INTO account_events (id, user_id, actor_id, action, detail, created_at)
          VALUES (?, ?, ?, 'payment_rejected', ?, ?)`,
        args: [
          crypto.randomUUID(),
          payment.userId,
          adminId,
          `Payment rejected (reference ${payment.reference}). Reason: ${safeReason}`,
          now,
        ],
      },
    ],
    'write',
  )

  if (results[0]?.rowsAffected === 0) return null

  return getPaymentById(paymentId)
}
