'use server'

import { revalidatePath } from 'next/cache'
import { parseMockWorkbook } from '@/lib/mock-excel'
import {
  addPracticeTopic,
  addPracticeQuestions,
  deletePracticeTopic,
  getPracticeTopics,
  getPracticeTopic,
} from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import type {
  PracticeExcelImportState,
  PracticeExcelSaveState,
  ParsedMockQuestion,
} from '@/lib/mock-types'

const MAX_FILE_BYTES = 15 * 1024 * 1024
const MAX_QUESTIONS = 500

const idleImport: PracticeExcelImportState = {
  status: 'idle',
  message: '',
  questions: [],
  warnings: [],
  suggestedTitle: '',
  fileName: '',
  topicId: '',
}

const idleSave: PracticeExcelSaveState = { status: 'idle', message: '' }

export async function importPracticeExcelAction(
  _previousState: PracticeExcelImportState,
  formData: FormData,
): Promise<PracticeExcelImportState> {
  await requireAdmin()
  const file = formData.get('practiceExcel')
  const topicId = String(formData.get('topicId') ?? '').trim()
  const topicTitle = String(formData.get('topicTitle') ?? '').trim()

  if (!(file instanceof File) || file.size === 0) {
    return { ...idleImport, status: 'error', message: 'Choose an Excel file (.xlsx, .xls, or .csv) to import.' }
  }
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
    return { ...idleImport, status: 'error', message: 'Only .xlsx, .xls, and .csv files can be imported.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ...idleImport, status: 'error', message: 'The file is too large. Use a workbook smaller than 15 MB.' }
  }

  try {
    const result = parseMockWorkbook(await file.arrayBuffer(), file.name)

    if (result.questions.length === 0) {
      return {
        ...idleImport,
        status: 'error',
        topicId,
        fileName: file.name,
        warnings: result.warnings,
        message:
          'No questions could be read. Check that the sheet has a Question column and option columns (Option A-D), plus a correct answer column.',
      }
    }

    const sheetNote = result.sheetNames.length > 1 ? ` across ${result.sheetNames.length} sheets` : ''
    return {
      status: 'success',
      topicId,
      topicTitle,
      message: `Read ${result.questions.length} question${result.questions.length === 1 ? '' : 's'}${sheetNote} in Excel order. Review them below, then save to the practice topic.`,
      questions: result.questions,
      warnings: result.warnings,
      suggestedTitle: result.suggestedTitle,
      fileName: file.name,
    }
  } catch (error) {
    console.error('Failed to read practice workbook:', error)
    return {
      ...idleImport,
      status: 'error',
      topicId,
      fileName: file.name,
      message: 'The workbook could not be read. Make sure it is a valid Excel or CSV file and try again.',
    }
  }
}

function parsePracticeQuestions(raw: FormDataEntryValue | null): ParsedMockQuestion[] | null {
  if (typeof raw !== 'string' || !raw.trim()) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const questions: ParsedMockQuestion[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') return null
      const entry = item as Record<string, unknown>
      const question = String(entry.question ?? '').trim()
      const correct = String(entry.correct ?? '').trim()
      const options = Array.isArray(entry.options)
        ? entry.options.map((option) => String(option).trim()).filter(Boolean)
        : []

      if (!question || options.length < 2 || !options.includes(correct)) return null

      questions.push({
        position: questions.length + 1,
        question,
        options,
        correct,
        explanation: String(entry.explanation ?? '').trim(),
      })
    }

    return questions
  } catch {
    return null
  }
}

export async function savePracticeExcelQuestionsAction(
  _previousState: PracticeExcelSaveState,
  formData: FormData,
): Promise<PracticeExcelSaveState> {
  await requireAdmin()
  const topicId = String(formData.get('topicId') ?? '').trim()
  const topicTitle = String(formData.get('topicTitle') ?? '').trim()
  const topicDescription = String(formData.get('topicDescription') ?? '').trim()
  const fileName = String(formData.get('fileName') ?? '').trim() || 'manual-entry'
  const questions = parsePracticeQuestions(formData.get('questions'))

  if (!topicId) return { status: 'error', message: 'Please select a practice topic.' }
  if (!topicTitle) return { status: 'error', message: 'Add a title for the practice topic.' }
  if (!questions) {
    return { status: 'error', message: 'Import an Excel file with valid questions before saving.' }
  }
  if (questions.length > MAX_QUESTIONS) {
    return { status: 'error', message: `A practice topic can contain at most ${MAX_QUESTIONS} questions.` }
  }

  try {
    // Create topic if it doesn't exist
    const existing = await getPracticeTopic(topicId)
    if (!existing?.topic) {
      await addPracticeTopic({
        id: topicId,
        title: topicTitle,
        description: topicDescription || null,
      })
    }

    await addPracticeQuestions({
      topicId,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correct,
      })),
    })

    revalidatePath('/admin/practice')
    revalidatePath('/practice')

    return {
      status: 'success',
      message: `Saved “${topicTitle}” with ${questions.length} question${questions.length === 1 ? '' : 's'} in Excel order.`,
    }
  } catch (error) {
    console.error('Failed to save practice questions:', error)
    return { status: 'error', message: 'The practice questions could not be saved. Check the database connection and try again.' }
  }
}

async function dbGetPracticeTopic(topicId: string) {
  const { getPracticeTopic } = await import('@/lib/db')
  return getPracticeTopic(topicId)
}

export async function deletePracticeTopicAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  try {
    await deletePracticeTopic(id)
    revalidatePath('/admin/practice')
    revalidatePath('/practice')
  } catch (error) {
    console.error('Failed to delete practice topic:', error)
  }
}
