import 'server-only'

import { db } from '@/lib/db'
import { normalizeIdentifier } from '@/lib/identifiers'
import { hashPassword, validatePassword, verifyPassword } from '@/lib/password'

type ColumnInfo = { name: string; notnull: boolean }

async function tableExists(name: string) {
  const result = await db().execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [name],
  })
  return result.rows.length > 0
}

async function tableColumns(name: string) {
  const result = await db().execute(`PRAGMA table_info("${name.replace(/"/g, '""')}")`)
  const columns = new Map<string, ColumnInfo>()
  for (const row of result.rows) {
    columns.set(String(row.name), {
      name: String(row.name),
      notnull: Number(row.notnull) === 1,
    })
  }
  return columns
}

const CREATE_USERS = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'terminated')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'approved', 'rejected')),
  premium_entitlement INTEGER NOT NULL DEFAULT 0 CHECK (premium_entitlement IN (0, 1)),
  premium_activated_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
)`

const CREATE_PAYMENTS = `CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  plan TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by INTEGER,
  reason TEXT,
  receipt_name TEXT NOT NULL,
  receipt_url TEXT,
  telegram_message_id INTEGER,
  telegram_file_id TEXT,
  telegram_file_unique_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`

type Migration = {
  version: number
  name: string
  up: () => Promise<void>
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create-users-with-auth-and-premium-fields',
    up: async () => {
      if (!(await tableExists('users'))) {
        await db().execute(CREATE_USERS)
      } else {
        const columns = await tableColumns('users')
        const alreadyFinal =
          columns.has('phone') &&
          columns.has('status') &&
          columns.has('payment_status') &&
          columns.has('premium_entitlement') &&
          columns.get('email')?.notnull === false

        if (!alreadyFinal) {
          const emailExpression = columns.has('email')
            ? "CASE WHEN email IS NULL OR trim(email) = '' THEN NULL ELSE lower(trim(email)) END"
            : 'NULL'
          const roleExpression = columns.has('role')
            ? "CASE WHEN lower(role) = 'admin' THEN 'admin' ELSE 'user' END"
            : "'user'"
          const passwordExpression = columns.has('password_hash')
            ? 'password_hash'
            : "''"
          const createdAtExpression = columns.has('created_at')
            ? "coalesce(created_at, datetime('now'))"
            : "datetime('now')"
          const nameExpression = columns.has('name') ? 'name' : "'Learner'"

          await db().execute('DROP TABLE IF EXISTS users_migrated')
          await db().execute(CREATE_USERS.replace('CREATE TABLE users', 'CREATE TABLE users_migrated'))
          await db().execute(`INSERT INTO users_migrated (
            id, name, email, phone, password_hash, role, status, payment_status,
            premium_entitlement, premium_activated_at, last_login_at, created_at, updated_at
          )
          SELECT
            id, ${nameExpression}, ${emailExpression}, NULL, ${passwordExpression},
            ${roleExpression}, 'active', 'unpaid', 0, NULL, NULL,
            ${createdAtExpression}, ${createdAtExpression}
          FROM users`)
          await db().execute('DROP TABLE users')
          await db().execute('ALTER TABLE users_migrated RENAME TO users')
        }
      }

      await db().execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email) WHERE email IS NOT NULL',
      )
      await db().execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone) WHERE phone IS NOT NULL',
      )
      await db().execute('CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)')
    },
  },
  {
    version: 2,
    name: 'create-payments-with-telegram-metadata',
    up: async () => {
      if (!(await tableExists('payments'))) {
        await db().execute(CREATE_PAYMENTS)
      } else {
        const columns = await tableColumns('payments')
        const alreadyFinal = columns.has('telegram_file_id') && columns.has('reviewed_by')
        if (!alreadyFinal) {
          await db().execute('DROP TABLE IF EXISTS payments_migrated')
          await db().execute(CREATE_PAYMENTS.replace('CREATE TABLE payments', 'CREATE TABLE payments_migrated'))

          const pick = (name: string, fallback: string) =>
            columns.has(name) ? `coalesce(${name}, ${fallback})` : fallback

          await db().execute(`INSERT INTO payments_migrated (
            id, user_id, user_name, user_email, user_phone, plan, amount, reference, status,
            submitted_at, reviewed_at, reviewed_by, reason, receipt_name, receipt_url,
            telegram_message_id, telegram_file_id, telegram_file_unique_id, created_at, updated_at
          )
          SELECT
            id,
            CAST(${columns.has('user_id') ? 'user_id' : '0'} AS INTEGER),
            ${pick('user_name', "'Learner'")},
            ${columns.has('user_email') ? 'user_email' : 'NULL'},
            ${columns.has('user_phone') ? 'user_phone' : 'NULL'},
            ${pick('plan', "'premium_1000'")},
            ${pick('amount', '0')},
            ${pick('reference', "'legacy-' || id")},
            CASE WHEN ${columns.has('status') ? 'status' : "'pending'"} IN ('pending', 'approved', 'rejected')
              THEN ${columns.has('status') ? 'status' : "'pending'"}
              ELSE 'pending'
            END,
            ${pick('submitted_at', "datetime('now')")},
            NULL, NULL,
            ${columns.has('reason') ? 'reason' : 'NULL'},
            ${pick('receipt_name', "'payment-proof'")},
            NULL, NULL, NULL, NULL,
            ${pick('created_at', "datetime('now')")},
            ${pick('updated_at', "datetime('now')")}
          FROM payments`)
          await db().execute('DROP TABLE payments')
          await db().execute('ALTER TABLE payments_migrated RENAME TO payments')
        }
      }

      await db().execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS payments_one_pending_per_user ON payments (user_id) WHERE status = 'pending'",
      )
      await db().execute('CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status, submitted_at)')
      await db().execute('CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id, submitted_at)')
    },
  },
  {
    version: 3,
    name: 'create-account-events',
    up: async () => {
      await db().execute(`CREATE TABLE IF NOT EXISTS account_events (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        actor_id INTEGER,
        action TEXT NOT NULL,
        detail TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`)
      await db().execute(
        'CREATE INDEX IF NOT EXISTS account_events_user_idx ON account_events (user_id, created_at)',
      )
      await db().execute(
        'CREATE INDEX IF NOT EXISTS account_events_created_idx ON account_events (created_at)',
      )
    },
  },
  {
    version: 4,
    name: 'ensure-learner-device-tables',
    up: async () => {
      await db().execute(`CREATE TABLE IF NOT EXISTS learner_access (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        plan TEXT NOT NULL,
        restricted INTEGER NOT NULL DEFAULT 0,
        restricted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`)
      await db().execute(`CREATE TABLE IF NOT EXISTS learner_devices (
        email TEXT NOT NULL,
        device_id TEXT NOT NULL,
        label TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        PRIMARY KEY (email, device_id)
      )`)
      await db().execute(
        'CREATE INDEX IF NOT EXISTS learner_devices_email_idx ON learner_devices (email)',
      )
    },
  },
  {
    version: 5,
    name: 'ensure-content-tables',
    up: async () => {
      await db().execute(`CREATE TABLE IF NOT EXISTS study_modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_data BLOB NOT NULL,
        created_at TEXT NOT NULL
      )`)
      await db().execute(`CREATE TABLE IF NOT EXISTS mock_tests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        file_name TEXT NOT NULL,
        question_count INTEGER NOT NULL,
        time_limit_min INTEGER,
        pass_mark INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`)
      await db().execute(`CREATE TABLE IF NOT EXISTS mock_questions (
        id TEXT PRIMARY KEY,
        mock_test_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        question TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`)
    },
  },
  {
    version: 6,
    name: 'ensure-study-categories',
    up: async () => {
      await db().execute(`CREATE TABLE IF NOT EXISTS study_categories (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`)
      await db().execute(`CREATE INDEX IF NOT EXISTS study_categories_title_idx ON study_categories (title)`)

      // Add category_id to existing study_modules if missing
      const moduleColumns = await tableColumns('study_modules')
      if (!moduleColumns.has('category_id')) {
        await db().execute('ALTER TABLE study_modules ADD COLUMN category_id TEXT')
        await db().execute('CREATE INDEX IF NOT EXISTS study_modules_category_idx ON study_modules (category_id)')
      }

      await db().execute(`CREATE TABLE IF NOT EXISTS study_category_questions (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        question TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`)
      await db().execute('CREATE INDEX IF NOT EXISTS study_category_questions_category_idx ON study_category_questions (category_id)')

      // Migrate existing modules without a category into a default "General" category
      const uncategorized = await db().execute(
        'SELECT id FROM study_modules WHERE category_id IS NULL',
      )
      if (uncategorized.rows.length > 0) {
        const defaultId = 'general'
        const now = new Date().toISOString()
        await db().execute({
          sql: `INSERT OR IGNORE INTO study_categories (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          args: [defaultId, 'General', 'Modules uploaded before categories were introduced.', now, now],
        })
        await db().execute({
          sql: 'UPDATE study_modules SET category_id = ? WHERE category_id IS NULL',
          args: [defaultId],
        })
      }
    },
  },
  {
    version: 7,
    name: 'ensure-study-module-urls',
    up: async () => {
      // Add file_url column to study_modules if missing
      const moduleColumns = await tableColumns('study_modules')
      if (!moduleColumns.has('file_url')) {
        await db().execute('ALTER TABLE study_modules ADD COLUMN file_url TEXT')
      }
      // Make file_data nullable if it isn't already
      if (moduleColumns.has('file_data')) {
        const col = moduleColumns.get('file_data')
        if (col && col.notnull) {
          await db().execute('ALTER TABLE study_modules RENAME TO study_modules_old')
          await db().execute(`CREATE TABLE study_modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id TEXT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            file_name TEXT,
            file_url TEXT,
            file_data BLOB,
            created_at TEXT NOT NULL
          )`)
          await db().execute(`INSERT INTO study_modules (id, category_id, title, description, file_name, file_url, file_data, created_at)
            SELECT id, category_id, title, description, file_name, NULL, file_data, created_at FROM study_modules_old`)
          await db().execute('DROP TABLE study_modules_old')
        }
      }
      await db().execute('CREATE INDEX IF NOT EXISTS study_modules_file_url_idx ON study_modules (file_url)')
    },
  },
]

async function seedAdminAccount() {
  const rawEmail = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = (process.env.ADMIN_NAME || 'Administrator').trim().slice(0, 120)

  const identifier = normalizeIdentifier(rawEmail)
  if (!identifier || identifier.kind !== 'email') {
    console.warn('ADMIN_EMAIL is missing or invalid; the admin account was not seeded.')
    return
  }
  if (!password || validatePassword(password)) {
    console.warn('ADMIN_PASSWORD is missing or too weak; the admin account was not seeded.')
    return
  }

  const now = new Date().toISOString()
  const existing = await db().execute({
    sql: 'SELECT id, password_hash FROM users WHERE email = ?',
    args: [identifier.value],
  })
  const row = existing.rows[0]

  if (!row) {
    await db().execute({
      sql: `INSERT INTO users (
        name, email, phone, password_hash, role, status, payment_status,
        premium_entitlement, premium_activated_at, last_login_at, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, 'admin', 'active', 'approved', 1, ?, NULL, ?, ?)`,
      args: [name, identifier.value, await hashPassword(password), now, now, now],
    })
    return
  }

  const passwordMatches = await verifyPassword(password, String(row.password_hash ?? ''))
  const passwordHash = passwordMatches ? String(row.password_hash) : await hashPassword(password)

  await db().execute({
    sql: `UPDATE users SET
      name = ?, email = ?, password_hash = ?, role = 'admin', status = 'active',
      payment_status = 'approved', premium_entitlement = 1,
      premium_activated_at = coalesce(premium_activated_at, ?), updated_at = ?
      WHERE id = ?`,
    args: [name, identifier.value, passwordHash, now, now, row.id],
  })

  await db().execute({
    sql: "UPDATE learner_access SET plan = 'premium_1000', updated_at = ? WHERE email = ?",
    args: [now, identifier.value],
  })
}

let schemaPromise: Promise<void> | undefined

async function runMigrations() {
  await db().execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )`)

  const applied = await db().execute('SELECT version FROM schema_migrations')
  const appliedVersions = new Set(applied.rows.map((row) => Number(row.version)))

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue
    await migration.up()
    await db().execute({
      sql: 'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
      args: [migration.version, migration.name, new Date().toISOString()],
    })
  }

  await seedAdminAccount()
}

/**
 * Runs the schema migrations exactly once per server process. Every database
 * access path that depends on the auth/payment schema awaits this first.
 */
export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = runMigrations().catch((error) => {
      schemaPromise = undefined
      throw error
    })
  }
  return schemaPromise
}
