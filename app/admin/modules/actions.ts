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
  getStudyCategories,
  getStudyCategory,
} from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import type {
  ModuleFormState,
  CategoryFormState,
  QuestionFormState,
  StudyCategory,
} from '@/lib/types'

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
  if (!description) return { status: 'error', message: 'Please add a short description.' }
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
