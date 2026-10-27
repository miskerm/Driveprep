import { createClient, type Client } from '@libsql/client'
import type { AdminUser, StudyModule, StudyModuleFile, StudyCategory, CategoryQuestion } from '@/lib/types'
import type { ParsedMockQuestion, SavedMockTest } from '@/lib/mock-types'
import type { LearnerAccess, LearnerDevice, LearnerPlan } from '@/lib/access-types'

let client: Client | undefined

export function db(): Client {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) throw new Error('TURSO_DATABASE_URL is not configured')
  if (!client) client = createClient({ url, authToken, intMode: 'number' })
  return client
}

let tableReady = false

async function ensureStudyModulesTable() {
  if (tableReady) return
  await db().execute(`CREATE TABLE IF NOT EXISTS study_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_data BLOB NOT NULL,
    created_at TEXT NOT NULL
  )`)
  await db().execute(`CREATE TABLE IF NOT EXISTS study_categories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)
  await db().execute(`CREATE TABLE IF NOT EXISTS study_category_questions (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`)
  tableReady = true
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  return Number(value ?? 0)
}

function toBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (Array.isArray(value)) return new Uint8Array(value)
  return new Uint8Array()
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
    }
  }
  throw lastError
}

export async function getStudyModules(): Promise<StudyModule[]> {
  try {
    return await withRetry(async () => {
      await ensureStudyModulesTable()
      const result = await db().execute(
        'SELECT id, category_id, title, description, file_url, file_name, created_at FROM study_modules ORDER BY category_id IS NULL, category_id, id DESC',
      )
      return result.rows.map((row) => ({
        id: toNumber(row.id),
        categoryId: row.category_id === null || row.category_id === undefined ? null : String(row.category_id),
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        fileUrl: row.file_url === null || row.file_url === undefined ? null : String(row.file_url),
        fileName: row.file_name === null || row.file_name === undefined ? null : String(row.file_name),
        createdAt: String(row.created_at ?? ''),
      }))
    })
  } catch (error) {
    console.error('Could not load study modules:', error)
    return []
  }
}

export async function getStudyModulesByCategory(categoryId: string): Promise<StudyModule[]> {
  try {
    return await withRetry(async () => {
      await ensureStudyModulesTable()
      const result = await db().execute({
        sql: 'SELECT id, category_id, title, description, file_url, file_name, created_at FROM study_modules WHERE category_id = ? ORDER BY id DESC',
        args: [categoryId],
      })
      return result.rows.map((row) => ({
        id: toNumber(row.id),
        categoryId: row.category_id === null || row.category_id === undefined ? null : String(row.category_id),
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        fileUrl: row.file_url === null || row.file_url === undefined ? null : String(row.file_url),
        fileName: row.file_name === null || row.file_name === undefined ? null : String(row.file_name),
        createdAt: String(row.created_at ?? ''),
      }))
    })
  } catch (error) {
    console.error(`Could not load study modules for category ${categoryId}:`, error)
    return []
  }
}

export async function getStudyModuleFile(id: number): Promise<StudyModuleFile | null> {
  try {
    return await withRetry(async () => {
      await ensureStudyModulesTable()
      const result = await db().execute({
        sql: 'SELECT id, category_id, title, file_name, file_url FROM study_modules WHERE id = ?',
        args: [id],
      })
      const row = result.rows[0]
      if (!row) return null
      return {
        id: toNumber(row.id),
        categoryId: row.category_id === null || row.category_id === undefined ? null : String(row.category_id),
        title: String(row.title ?? ''),
        fileName: row.file_name === null || row.file_name === undefined ? null : String(row.file_name),
        fileUrl: row.file_url === null || row.file_url === undefined ? null : String(row.file_url),
      }
    })
  } catch (error) {
    console.error(`Could not load study module ${id}:`, error)
    return null
  }
}

export async function addStudyModule(input: {
  categoryId: string | null
  title: string
  description: string
  fileUrl: string | null
  fileName: string | null
}) {
  await ensureStudyModulesTable()
  await db().execute({
    sql: 'INSERT INTO study_modules (category_id, title, description, file_url, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [input.categoryId, input.title, input.description, input.fileUrl, input.fileName, new Date().toISOString()],
  })
  tableReady = false
}

export async function deleteStudyModule(id: number) {
  await withRetry(async () => {
    await ensureStudyModulesTable()
    await db().execute({ sql: 'DELETE FROM study_modules WHERE id = ?', args: [id] })
  })
}

// ============ Study Categories ============

export async function getStudyCategories(): Promise<StudyCategory[]> {
  try {
    return await withRetry(async () => {
      await ensureStudyModulesTable()
      const categoriesResult = await db().execute(`
        SELECT c.id, c.title, c.description, c.created_at, c.updated_at
        FROM study_categories c
        ORDER BY c.created_at DESC
      `)
      const categoryIds = categoriesResult.rows.map((row) => String(row.id ?? ''))

      // Load all modules and all questions in parallel (2 batches instead of N+1 sequential)
      const [modulesResults, questionsResults] = await Promise.all([
        Promise.all(
          categoryIds.map((id) =>
            db().execute({
              sql: 'SELECT id, category_id, title, description, file_url, file_name, created_at FROM study_modules WHERE category_id = ? ORDER BY id DESC',
              args: [id],
            })
          )
        ),
        Promise.all(
          categoryIds.map((id) =>
            db().execute({
              sql: 'SELECT id, category_id, question, options_json, correct_answer, position, created_at FROM study_category_questions WHERE category_id = ? ORDER BY position ASC, created_at ASC',
              args: [id],
            })
          )
        ),
      ])

      // Build lookup maps keyed by category id
      const modulesByCategory = new Map<string, StudyModule[]>()
      const questionsByCategory = new Map<string, CategoryQuestion[]>()

      categoryIds.forEach((id, idx) => {
        modulesByCategory.set(
          id,
          modulesResults[idx].rows.map((row) => ({
            id: toNumber(row.id),
            categoryId: row.category_id === null || row.category_id === undefined ? null : String(row.category_id),
            title: String(row.title ?? ''),
            description: String(row.description ?? ''),
            fileUrl: row.file_url === null || row.file_url === undefined ? null : String(row.file_url),
            fileName: row.file_name === null || row.file_name === undefined ? null : String(row.file_name),
            createdAt: String(row.created_at ?? ''),
          }))
        )

        questionsByCategory.set(
          id,
          questionsResults[idx].rows.map((qrow) => ({
            id: String(qrow.id ?? ''),
            categoryId: String(qrow.category_id ?? ''),
            question: String(qrow.question ?? ''),
            options: JSON.parse(String(qrow.options_json ?? '[]')),
            correctAnswer: String(qrow.correct_answer ?? ''),
            position: toNumber(qrow.position),
            createdAt: String(qrow.created_at ?? ''),
          }))
        )
      })

      const categories: StudyCategory[] = []
      for (const row of categoriesResult.rows) {
        const id = String(row.id ?? '')
        categories.push({
          id,
          title: String(row.title ?? ''),
          description: row.description === null || row.description === undefined ? null : String(row.description),
          modules: modulesByCategory.get(id) ?? [],
          questions: questionsByCategory.get(id) ?? [],
          createdAt: String(row.created_at ?? ''),
          updatedAt: String(row.updated_at ?? ''),
        })
      }
      return categories
    })
  } catch (error) {
    console.error('Could not load study categories:', error)
    return []
  }
}

export async function getStudyCategory(categoryId: string): Promise<{
  category: StudyCategory | null
  modules: StudyModule[]
  questions: CategoryQuestion[]
} | null> {
  try {
    return await withRetry(async () => {
      await ensureStudyModulesTable()
      const categoryResult = await db().execute({
        sql: 'SELECT id, title, description, created_at, updated_at FROM study_categories WHERE id = ?',
        args: [categoryId],
      })
      const categoryRow = categoryResult.rows[0]
      if (!categoryRow) return null

      const modulesResult = await db().execute({
        sql: 'SELECT id, category_id, title, description, file_url, file_name, created_at FROM study_modules WHERE category_id = ? ORDER BY id DESC',
        args: [categoryId],
      })
      const modules = modulesResult.rows.map((row) => ({
        id: toNumber(row.id),
        categoryId: row.category_id === null || row.category_id === undefined ? null : String(row.category_id),
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        fileUrl: row.file_url === null || row.file_url === undefined ? null : String(row.file_url),
        fileName: row.file_name === null || row.file_name === undefined ? null : String(row.file_name),
        createdAt: String(row.created_at ?? ''),
      }))

      const questionsResult = await db().execute({
        sql: 'SELECT id, category_id, question, options_json, correct_answer, position, created_at FROM study_category_questions WHERE category_id = ? ORDER BY position ASC, created_at ASC',
        args: [categoryId],
      })
      const questions = questionsResult.rows.map((row) => ({
        id: String(row.id ?? ''),
        categoryId: String(row.category_id ?? ''),
        question: String(row.question ?? ''),
        options: JSON.parse(String(row.options_json ?? '[]')),
        correctAnswer: String(row.correct_answer ?? ''),
        position: toNumber(row.position),
        createdAt: String(row.created_at ?? ''),
      }))

      const category: StudyCategory = {
        id: String(categoryRow.id ?? ''),
        title: String(categoryRow.title ?? ''),
        description: categoryRow.description === null || categoryRow.description === undefined ? null : String(categoryRow.description),
        modules,
        questions,
        createdAt: String(categoryRow.created_at ?? ''),
        updatedAt: String(categoryRow.updated_at ?? ''),
      }

      return { category, modules, questions }
    })
  } catch (error) {
    console.error(`Could not load study category ${categoryId}:`, error)
    return null
  }
}

export async function createStudyCategory(input: {
  id: string
  title: string
  description?: string | null
}) {
  await ensureStudyModulesTable()
  const now = new Date().toISOString()
  await db().execute({
    sql: 'INSERT INTO study_categories (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    args: [input.id, input.title, input.description ?? null, now, now],
  })
}

export async function updateStudyCategory(input: {
  id: string
  title: string
  description?: string | null
}) {
  await ensureStudyModulesTable()
  const now = new Date().toISOString()
  await db().execute({
    sql: 'UPDATE study_categories SET title = ?, description = ?, updated_at = ? WHERE id = ?',
    args: [input.title, input.description ?? null, now, input.id],
  })
}

export async function deleteStudyCategory(categoryId: string) {
  await withRetry(async () => {
    await ensureStudyModulesTable()
    await db().batch(
      [
        { sql: 'DELETE FROM study_category_questions WHERE category_id = ?', args: [categoryId] },
        { sql: 'DELETE FROM study_modules WHERE category_id = ?', args: [categoryId] },
        { sql: 'DELETE FROM study_categories WHERE id = ?', args: [categoryId] },
      ],
      'write',
    )
  })
}

// ============ Category Questions ============

export async function addCategoryQuestion(input: {
  id: string
  categoryId: string
  question: string
  options: string[]
  correctAnswer: string
}) {
  await ensureStudyModulesTable()
  const now = new Date().toISOString()
  // Determine next position
  const last = await db().execute({
    sql: 'SELECT COALESCE(MAX(position), 0) AS max_pos FROM study_category_questions WHERE category_id = ?',
    args: [input.categoryId],
  })
  const position = toNumber(last.rows[0].max_pos) + 1

  await db().execute({
    sql: 'INSERT INTO study_category_questions (id, category_id, question, options_json, correct_answer, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [input.id, input.categoryId, input.question, JSON.stringify(input.options), input.correctAnswer, position, now],
  })
}

export async function deleteCategoryQuestion(questionId: string) {
  await withRetry(async () => {
    await ensureStudyModulesTable()
    await db().execute({ sql: 'DELETE FROM study_category_questions WHERE id = ?', args: [questionId] })
  })
}

// ============ End of new functions ============

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    return await withRetry(async () => {
      const result = await db().execute('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC LIMIT 100')
      return result.rows.map((row) => ({
        id: toNumber(row.id),
        name: String(row.name ?? ''),
        email: String(row.email ?? ''),
        role: String(row.role ?? 'user'),
        createdAt: String(row.created_at ?? ''),
      }))
    })
  } catch (error) {
    console.error('Could not load users:', error)
    return []
  }
}

let accessTablesReady = false

async function ensureAccessTables() {
  if (accessTablesReady) return
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
  await db().execute('CREATE INDEX IF NOT EXISTS learner_devices_email_idx ON learner_devices (email)')
  accessTablesReady = true
}

export async function getLearnerAccess(email: string): Promise<LearnerAccess | null> {
  try {
    return await withRetry(async () => {
      await ensureAccessTables()
      // Run both queries in parallel instead of sequentially
      const [accessResult, deviceResult] = await Promise.all([
        db().execute({
          sql: 'SELECT email, name, plan, restricted, restricted_at, created_at, updated_at FROM learner_access WHERE email = ?',
          args: [email],
        }),
        db().execute({
          sql: 'SELECT device_id, label, user_agent, first_seen, last_seen FROM learner_devices WHERE email = ? ORDER BY last_seen DESC',
          args: [email],
        }),
      ])

      const row = accessResult.rows[0]
      if (!row) return null

      const devices: LearnerDevice[] = deviceResult.rows.map((device) => ({
        deviceId: String(device.device_id ?? ''),
        label: String(device.label ?? 'Unknown device'),
        userAgent: String(device.user_agent ?? ''),
        firstSeen: String(device.first_seen ?? ''),
        lastSeen: String(device.last_seen ?? ''),
      }))

      return {
        email: String(row.email ?? ''),
        name: String(row.name ?? 'Learner'),
        plan: (String(row.plan ?? 'free') === 'premium_1000' ? 'premium_1000' : 'free') as LearnerPlan,
        restricted: toNumber(row.restricted) === 1,
        restrictedAt: row.restricted_at === null ? null : String(row.restricted_at),
        deviceCount: devices.length,
        devices,
        createdAt: String(row.created_at ?? ''),
        updatedAt: String(row.updated_at ?? ''),
      }
    })
  } catch (error) {
    console.error(`Could not load learner access for ${email}:`, error)
    return null
  }
}

export async function registerLearnerDevice(input: {
  email: string
  name: string
  plan: LearnerPlan
  deviceId: string
  label: string
  userAgent: string
}): Promise<LearnerAccess> {
  await ensureAccessTables()
  const now = new Date().toISOString()

  const existing = await withRetry(async () =>
    db().execute({ sql: 'SELECT email FROM learner_access WHERE email = ?', args: [input.email] }),
  )

  if (existing.rows.length === 0) {
    await db().execute({
      sql: 'INSERT INTO learner_access (email, name, plan, restricted, restricted_at, created_at, updated_at) VALUES (?, ?, ?, 0, NULL, ?, ?)',
      args: [input.email, input.name, input.plan, now, now],
    })
  } else {
    await db().execute({
      sql: 'UPDATE learner_access SET name = ?, plan = ?, updated_at = ? WHERE email = ?',
      args: [input.name, input.plan, now, input.email],
    })
  }

  const knownDevice = await withRetry(async () =>
    db().execute({
      sql: 'SELECT device_id FROM learner_devices WHERE email = ? AND device_id = ?',
      args: [input.email, input.deviceId],
    }),
  )

  if (knownDevice.rows.length === 0) {
    await db().execute({
      sql: 'INSERT INTO learner_devices (email, device_id, label, user_agent, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
      args: [input.email, input.deviceId, input.label, input.userAgent, now, now],
    })
  } else {
    await db().execute({
      sql: 'UPDATE learner_devices SET label = ?, user_agent = ?, last_seen = ? WHERE email = ? AND device_id = ?',
      args: [input.label, input.userAgent, now, input.email, input.deviceId],
    })
  }

  const access = await getLearnerAccess(input.email)
  if (!access) throw new Error(`Learner access for ${input.email} could not be read after registering the device.`)
  return access
}

export async function getTrackedLearners(): Promise<LearnerAccess[]> {
  try {
    return await withRetry(async () => {
      await ensureAccessTables()
      // Run both queries in parallel instead of sequentially
      const [accessResult, deviceResult] = await Promise.all([
        db().execute(
          'SELECT email, name, plan, restricted, restricted_at, created_at, updated_at FROM learner_access ORDER BY updated_at DESC, email ASC LIMIT 200'
        ),
        db().execute(
          'SELECT email, device_id, label, user_agent, first_seen, last_seen FROM learner_devices ORDER BY last_seen DESC LIMIT 1000'
        ),
      ])

      if (accessResult.rows.length === 0) return []

      const devicesByEmail = new Map<string, LearnerDevice[]>()
      for (const device of deviceResult.rows) {
        const email = String(device.email ?? '')
        const list = devicesByEmail.get(email) ?? []
        list.push({
          deviceId: String(device.device_id ?? ''),
          label: String(device.label ?? 'Unknown device'),
          userAgent: String(device.user_agent ?? ''),
          firstSeen: String(device.first_seen ?? ''),
          lastSeen: String(device.last_seen ?? ''),
        })
        devicesByEmail.set(email, list)
      }

      return accessResult.rows.map((row) => {
        const email = String(row.email ?? '')
        const devices = devicesByEmail.get(email) ?? []
        return {
          email,
          name: String(row.name ?? 'Learner'),
          plan: (String(row.plan ?? 'free') === 'premium_1000' ? 'premium_1000' : 'free') as LearnerPlan,
          restricted: toNumber(row.restricted) === 1,
          restrictedAt: row.restricted_at === null ? null : String(row.restricted_at),
          deviceCount: devices.length,
          devices,
          createdAt: String(row.created_at ?? ''),
          updatedAt: String(row.updated_at ?? ''),
        }
      })
    })
  } catch (error) {
    console.error('Could not load tracked learners:', error)
    return []
  }
}

export async function setPremiumRestriction(
  email: string,
  restricted: boolean,
  options?: { name?: string; plan?: LearnerPlan },
) {
  await ensureAccessTables()
  const now = new Date().toISOString()
  await db().execute({
    sql: `INSERT INTO learner_access (email, name, plan, restricted, restricted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        restricted = excluded.restricted,
        restricted_at = excluded.restricted_at,
        updated_at = excluded.updated_at`,
    args: [
      email,
      options?.name || 'Learner',
      options?.plan || 'free',
      restricted ? 1 : 0,
      restricted ? now : null,
      now,
      now,
    ],
  })
  return true
}

let mockTablesReady = false

async function ensureMockTables() {
  if (mockTablesReady) return
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
  mockTablesReady = true
}

export async function getMockTestById(id: string): Promise<{
  id: string
  title: string
  description: string
  fileName: string
  questionCount: number
  timeLimitMin: number | null
  passMark: number
  createdAt: string
} | null> {
  try {
    return await withRetry(async () => {
      await ensureMockTables()
      const result = await db().execute({
        sql: 'SELECT id, title, description, file_name, question_count, time_limit_min, pass_mark, created_at FROM mock_tests WHERE id = ?',
        args: [id],
      })
      const row = result.rows[0]
      if (!row) return null
      return {
        id: String(row.id ?? ''),
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        fileName: String(row.file_name ?? ''),
        questionCount: toNumber(row.question_count),
        timeLimitMin: row.time_limit_min === null ? null : toNumber(row.time_limit_min),
        passMark: toNumber(row.pass_mark),
        createdAt: String(row.created_at ?? ''),
      }
    })
  } catch (error) {
    console.error(`Could not load mock test ${id}:`, error)
    return null
  }
}

export async function getMockTests(): Promise<SavedMockTest[]> {
  try {
    return await withRetry(async () => {
      await ensureMockTables()
      const result = await db().execute(
        'SELECT id, title, description, file_name, question_count, time_limit_min, pass_mark, created_at FROM mock_tests ORDER BY created_at DESC, id DESC',
      )
      return result.rows.map((row) => ({
        id: String(row.id ?? ''),
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        fileName: String(row.file_name ?? ''),
        questionCount: toNumber(row.question_count),
        timeLimitMin: row.time_limit_min === null ? null : toNumber(row.time_limit_min),
        passMark: toNumber(row.pass_mark),
        createdAt: String(row.created_at ?? ''),
      }))
    })
  } catch (error) {
    console.error('Could not load mock tests:', error)
    return []
  }
}

export async function addMockTest(input: {
  title: string
  description: string
  fileName: string
  timeLimitMin: number | null
  passMark: number
  questions: ParsedMockQuestion[]
}) {
  await ensureMockTables()

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const statements = [
    {
      sql: 'INSERT INTO mock_tests (id, title, description, file_name, question_count, time_limit_min, pass_mark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        id,
        input.title,
        input.description,
        input.fileName,
        input.questions.length,
        input.timeLimitMin,
        input.passMark,
        now,
      ],
    },
    ...input.questions.map((question) => ({
      sql: 'INSERT INTO mock_questions (id, mock_test_id, position, question, options_json, correct_answer, explanation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        `${id}:${question.position}`,
        id,
        question.position,
        question.question,
        JSON.stringify(question.options),
        question.correct,
        question.explanation,
        now,
      ],
    })),
  ]

  await db().batch(statements, 'write')
  return id
}

export async function deleteMockTest(id: string) {
  await withRetry(async () => {
    await ensureMockTables()
    await db().batch(
      [
        { sql: 'DELETE FROM mock_questions WHERE mock_test_id = ?', args: [id] },
        { sql: 'DELETE FROM mock_tests WHERE id = ?', args: [id] },
      ],
      'write',
    )
  })
}

export async function getMockTestQuestions(mockTestId: string): Promise<ParsedMockQuestion[]> {
  try {
    return await withRetry(async () => {
      await ensureMockTables()
      const result = await db().execute({
        sql: 'SELECT position, question, options_json, correct_answer, explanation, created_at FROM mock_questions WHERE mock_test_id = ? ORDER BY position ASC',
        args: [mockTestId],
      })
      return result.rows.map((row) => {
        let options: string[] = []
        try {
          const parsed = JSON.parse(String(row.options_json ?? '[]')) as unknown
          if (Array.isArray(parsed)) options = parsed.map((option) => String(option))
        } catch {
          options = []
        }
        return {
          position: toNumber(row.position),
          question: String(row.question ?? ''),
          options,
          correct: String(row.correct_answer ?? ''),
          explanation: String(row.explanation ?? ''),
        }
      })
    })
  } catch (error) {
    console.error(`Could not load mock questions for ${mockTestId}:`, error)
    return []
  }
}
