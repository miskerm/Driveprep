'use server'

import { revalidatePath } from 'next/cache'
import {
  addStudyModule,
  deleteStudyModule,
  createStudyCategory,
  updateStudyCategory,
  deleteStudyCategory,
  addCategoryQuestion,
  deleteCategoryQuestion,
  addStudyQuestionnaireWithQuestions,
  deleteStudyQuestionnaire,
  getStudyCategories,
  getStudyCategory,
} from '@/lib/db'
import { parseMockWorkbook } from '@/lib/mock-excel'
import { requireAdmin } from '@/lib/session'
import type {
  ModuleFormState,
  CategoryFormState,
  QuestionFormState,
  StudyCategory,
} from '@/lib/types'
import type {
  CategoryExcelImportState,
  CategoryExcelSaveState,
  ParsedMockQuestion,
} from '@/lib/mock-types'

const MAX_FILE_BYTES = 15 * 1024 * 1024
const MAX_QUESTIONS = 500

const idleImport: CategoryExcelImportState = {
  status: 'idle',
  message: '',
  questions: [],
  warnings: [],
  suggestedTitle: '',
  fileName: '',
  categoryId: '',
}

const idleSave: CategoryExcelSaveState = { status: 'idle', message: '' }

export async function createCategoryAction(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin()
  const id = String(formData.get('categoryId') ?? '').trim().toLowerCase().replace(/\s+/g, '-')
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()

  if (!id) return { status: 'error', message: 'Please add a category ID.' }
  if (!title) return { status: 'error', message: 'Please add a category title.' }
  if (!/^[a-z0-9-]+$/.test(id)) {
    return { status: 'error', message: 'Category ID must contain only lowercase letters, numbers, and hyphens.' }
  }

  try {
    await createStudyCategory({ id, title, description: description || null })
    revalidatePath('/admin/modules')
    revalidatePath('/study')
    return { status: 'success', message: `“${title}” category was created.` }
  } catch (error) {
    console.error('Failed to create category:', error)
    return { status: 'error', message: 'The category could not be created. It may already exist.' }
  }
}

export async function updateCategoryAction(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin()
  const id = String(formData.get('categoryId') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()

  if (!id) return { status: 'error', message: 'Category ID is required.' }
  if (!title) return { status: 'error', message: 'Please add a category title.' }

  try {
    await updateStudyCategory({ id, title, description: description || null })
    revalidatePath('/admin/modules')
    revalidatePath('/study')
    return { status: 'success', message: `“${title}” category was updated.` }
  } catch (error) {
    console.error('Failed to update category:', error)
    return { status: 'error', message: 'The category could not be updated.' }
  }
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  try {
    await deleteStudyCategory(id)
    revalidatePath('/admin/modules')
    revalidatePath('/study')
  } catch (error) {
    console.error('Failed to delete category:', error)
  }
}

export async function createModuleAction(
  _previousState: ModuleFormState,
  formData: FormData,
): Promise<ModuleFormState> {
  await requireAdmin()
  const categoryId = String(formData.get('categoryId') ?? '').trim() || null
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const fileUrl = String(formData.get('moduleUrl') ?? '').trim()

  if (!categoryId) return { status: 'error', message: 'Please select a category.' }
  if (!title) return { status: 'error', message: 'Please add a module title.' }
  if (!fileUrl) return { status: 'error', message: 'Please add a module URL.' }
  try {
    new URL(fileUrl)
  } catch {
    return { status: 'error', message: 'Please enter a valid URL (e.g. Google Drive link).' }
  }

  try {
    await addStudyModule({ categoryId, title, description, fileUrl, fileName: null })
    revalidatePath('/admin/modules')
    revalidatePath('/study')
    return { status: 'success', message: `“${title}” was added and is now available in Study.` }
  } catch (error) {
    console.error('Failed to add study module:', error)
    return { status: 'error', message: 'The module could not be saved. Check the database connection and try again.' }
  }
}

export async function deleteModuleAction(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isFinite(id) || id <= 0) return
  try {
    await deleteStudyModule(id)
    revalidatePath('/admin/modules')
    revalidatePath('/study')
  } catch (error) {
    console.error('Failed to delete study module:', error)
  }
}

export async function createCategoryQuestionAction(
  _previousState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin()
  const categoryId = String(formData.get('categoryId') ?? '').trim()
  const question = String(formData.get('question') ?? '').trim()
  const optionA = String(formData.get('optionA') ?? '').trim()
  const optionB = String(formData.get('optionB') ?? '').trim()
  const optionC = String(formData.get('optionC') ?? '').trim()
  const optionD = String(formData.get('optionD') ?? '').trim()
  const correctAnswer = String(formData.get('correctAnswer') ?? '').trim()

  if (!categoryId) return { status: 'error', message: 'Please select a category.' }
  if (!question) return { status: 'error', message: 'Please add a question.' }
  if (!optionA || !optionB || !optionC || !optionD) {
    return { status: 'error', message: 'Please provide all four answer options.' }
  }
  if (!correctAnswer) return { status: 'error', message: 'Please select the correct answer.' }

  const options = [optionA, optionB, optionC, optionD]
  if (!options.includes(correctAnswer)) {
    return { status: 'error', message: 'The correct answer must be one of the provided options.' }
  }

  const id = `${categoryId}-q-${crypto.randomUUID().slice(0, 8)}`

  try {
    await addCategoryQuestion({ id, categoryId, question, options, correctAnswer })
    revalidatePath('/admin/modules')
    revalidatePath('/study')
    return { status: 'success', message: 'Question was added to the category.' }
  } catch (error) {
    console.error('Failed to add category question:', error)
    return { status: 'error', message: 'The question could not be saved.' }
  }
}

export async function deleteCategoryQuestionAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  try {
    await deleteCategoryQuestion(id)
    revalidatePath('/admin/modules')
    revalidatePath('/study')
  } catch (error) {
    console.error('Failed to delete category question:', error)
  }
}

export async function importCategoryExcelAction(
  _previousState: CategoryExcelImportState,
  formData: FormData,
): Promise<CategoryExcelImportState> {
  await requireAdmin()
  const file = formData.get('categoryExcel')
  const categoryId = String(formData.get('categoryId') ?? '').trim()

  if (!categoryId) {
    return { ...idleImport, status: 'error', message: 'Please select a category.' }
  }
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
        categoryId,
        fileName: file.name,
        warnings: result.warnings,
        message:
          'No questions could be read. Check that the sheet has a Question column and option columns (Option A-D), plus a correct answer column.',
      }
    }

    const sheetNote = result.sheetNames.length > 1 ? ` across ${result.sheetNames.length} sheets` : ''
    return {
      status: 'success',
      categoryId,
      message: `Read ${result.questions.length} question${result.questions.length === 1 ? '' : 's'}${sheetNote} in Excel order. Review them below, then save the question set.`,
      questions: result.questions,
      warnings: result.warnings,
      suggestedTitle: result.suggestedTitle,
      fileName: file.name,
    }
  } catch (error) {
    console.error('Failed to read category workbook:', error)
    return {
      ...idleImport,
      status: 'error',
      categoryId,
      fileName: file.name,
      message: 'The workbook could not be read. Make sure it is a valid Excel or CSV file and try again.',
    }
  }
}

function parseCategoryQuestions(raw: FormDataEntryValue | null): ParsedMockQuestion[] | null {
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

export async function saveCategoryExcelQuestionsAction(
  _previousState: CategoryExcelSaveState,
  formData: FormData,
): Promise<CategoryExcelSaveState> {
  await requireAdmin()
  const categoryId = String(formData.get('categoryId') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const fileName = String(formData.get('fileName') ?? '').trim() || 'manual-entry'
  const questions = parseCategoryQuestions(formData.get('questions'))

  if (!categoryId) return { status: 'error', message: 'Please select a category.' }
  if (!title) return { status: 'error', message: 'Add a title for the question set.' }
  if (!questions) {
    return { status: 'error', message: 'Import an Excel file with valid questions before saving.' }
  }
  if (questions.length > MAX_QUESTIONS) {
    return { status: 'error', message: `A question set can contain at most ${MAX_QUESTIONS} questions.` }
  }

  const id = `${categoryId}-qn-${crypto.randomUUID().slice(0, 8)}`

  try {
    await addStudyQuestionnaireWithQuestions({
      id,
      categoryId,
      title,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correct,
        explanation: q.explanation,
      })),
    })

    revalidatePath('/admin/modules')
    revalidatePath('/study')

    return {
      status: 'success',
      message: `Saved “${title}” with ${questions.length} question${questions.length === 1 ? '' : 's'} in Excel order.`,
    }
  } catch (error) {
    console.error('Failed to save category question set:', error)
    return { status: 'error', message: 'The question set could not be saved. Check the database connection and try again.' }
  }
}

export async function deleteQuestionnaireAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  try {
    await deleteStudyQuestionnaire(id)
    revalidatePath('/admin/modules')
    revalidatePath('/study')
  } catch (error) {
    console.error('Failed to delete questionnaire:', error)
  }
}
