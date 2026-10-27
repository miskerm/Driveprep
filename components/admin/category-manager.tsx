'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Link as LinkIcon,
  Edit2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createModuleAction,
  deleteModuleAction,
  createCategoryQuestionAction,
  deleteCategoryQuestionAction,
} from '@/app/admin/modules/actions'
import type {
  CategoryFormState,
  ModuleFormState,
  QuestionFormState,
  StudyCategory,
} from '@/lib/types'

const initialCategoryState: CategoryFormState = { status: 'idle', message: '' }
const initialModuleState: ModuleFormState = { status: 'idle', message: '' }
const initialQuestionState: QuestionFormState = { status: 'idle', message: '' }

function formatBytes(bytes: number) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function slugify(title: string) {
  return title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function CategoryManager({ categories }: { categories: StudyCategory[] }) {
  const [categoryState, categoryAction, categoryPending] = useActionState(createCategoryAction, initialCategoryState)
  const categoryFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (categoryState.status === 'success') categoryFormRef.current?.reset()
  }, [categoryState])

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryTitle, setEditingCategoryTitle] = useState('')
  const [editingCategoryDesc, setEditingCategoryDesc] = useState('')

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)]">
      {/* Create Category */}
      <section className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
            <Plus className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#142238]">Create category</h2>
            <p className="mt-1 text-sm text-[#607477]">A category groups modules and practice questions together.</p>
          </div>
        </div>

        <form ref={categoryFormRef} action={categoryAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="cat-id" className="text-sm font-bold text-[#314957]">Category ID</label>
            <input
              id="cat-id"
              name="categoryId"
              type="text"
              required
              placeholder="e.g. road-signs"
              className="mt-1.5 w-full rounded-lg border border-[#cbd9d7] px-3 py-2.5 text-sm outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
            <p className="mt-1 text-xs text-[#718181]">Lowercase letters, numbers, and hyphens only. Used in URLs.</p>
          </div>
          <div>
            <label htmlFor="cat-title" className="text-sm font-bold text-[#314957]">Category title</label>
            <input
              id="cat-title"
              name="title"
              type="text"
              required
              placeholder="e.g. Road Signs & Signals"
              className="mt-1.5 w-full rounded-lg border border-[#cbd9d7] px-3 py-2.5 text-sm outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
          </div>
          <div>
            <label htmlFor="cat-desc" className="text-sm font-bold text-[#314957]">Description (optional)</label>
            <textarea
              id="cat-desc"
              name="description"
              rows={3}
              placeholder="What will learners study in this category?"
              className="mt-1.5 w-full resize-y rounded-lg border border-[#cbd9d7] px-3 py-2.5 text-sm outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
          </div>

          {categoryState.status !== 'idle' && (
            <p role="status" className={`flex items-start gap-2 rounded-lg p-3 text-sm font-semibold ${categoryState.status === 'success' ? 'bg-[#e6f5f3] text-[#06625e]' : 'bg-[#fdeeee] text-[#b33636]'}`}>
              {categoryState.status === 'success' && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
              {categoryState.message}
            </p>
          )}

          <button type="submit" disabled={categoryPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#087f78] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            <Plus className="size-4" />
            {categoryPending ? 'Creating…' : 'Create category'}
          </button>
        </form>
      </section>

      {/* Categories List */}
      <section className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#142238]">Categories</h2>
            <p className="mt-1 text-sm text-[#607477]">{categories.length} category{categories.length === 1 ? '' : 's'} organised for learners.</p>
          </div>
          <span className="rounded-full bg-[#e6f5f3] px-3 py-1 text-sm font-bold text-[#06625e]">{categories.length}</span>
        </div>

        {categories.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-8 text-center">
            <FileText className="mx-auto size-9 text-[#8aa5a1]" />
            <p className="mt-3 text-sm font-bold text-[#314957]">No categories yet</p>
            <p className="mt-1 text-xs text-[#718181]">Use the form above to create your first category.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

interface CategoryCardProps {
  category: StudyCategory
}

function CategoryCard({ category }: CategoryCardProps) {
  const [moduleState, moduleAction, modulePending] = useActionState(createModuleAction, initialModuleState)
  const [questionState, questionAction, questionPending] = useActionState(createCategoryQuestionAction, initialQuestionState)
  const moduleFormRef = useRef<HTMLFormElement>(null)
  const questionFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (moduleState.status === 'success') moduleFormRef.current?.reset()
  }, [moduleState])
  useEffect(() => {
    if (questionState.status === 'success') questionFormRef.current?.reset()
  }, [questionState])

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(category.title)
  const [editDesc, setEditDesc] = useState(category.description ?? '')
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  return (
    <article className="rounded-xl border border-[#e3e8e6] bg-white p-5 shadow-sm overflow-hidden">
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#314957] block">Category title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-[#314957] block">Description</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditTitle(category.title)
                setEditDesc(category.description ?? '')
                setEditing(false)
              }}
              className="px-4 py-2 rounded-lg border border-[#cbd9d7] text-sm font-bold text-[#607477]"
            >
              Cancel
            </button>
            <form
              action={async (fd: FormData) => {
                fd.set('categoryId', category.id)
                await updateCategoryAction({ status: 'idle', message: '' } as CategoryFormState, fd)
                setEditing(false)
              }}
              className="flex-1"
            >
              <input type="hidden" name="categoryId" value={category.id} />
              <input type="hidden" name="title" value={editTitle} />
              <input type="hidden" name="description" value={editDesc} />
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#087f78] text-sm font-bold text-white">
                Save
              </button>
            </form>
          </div>
          <div className="pt-4 border-t border-[#edf0ef]">
            <button
              onClick={() => setEditing(false)}
              className="text-xs font-bold text-[#b33636] hover:underline"
            >
              Done editing
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="grid size-10 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
                  <BookOpen className="size-5" />
                </span>
                <h3 className="text-lg font-extrabold text-[#142238]">{category.title}</h3>
                {category.description && (
                  <p className="mt-1 text-sm text-[#607477]">{category.description}</p>
                )}
              </div>
              <p className="text-xs font-semibold text-[#8aa5a1]">
                {category.modules.length} module{category.modules.length === 1 ? '' : 's'} ·
                {category.questions.length} question{category.questions.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditTitle(category.title)
                  setEditDesc(category.description ?? '')
                  setEditing(true)
                }}
                className="rounded-lg border border-[#cbd9d7] px-3 py-1.5 text-xs font-bold text-[#087f78] hover:bg-[#effafa]"
              >
                <Edit2 className="size-3.5 mr-1.5" /> Edit
              </button>
              <form
                onSubmit={(e) => {
                  if (!window.confirm(`Delete “${category.title}” category? This removes all its modules and questions and cannot be undone.`)) {
                    e.preventDefault()
                  }
                }}
                action={deleteCategoryAction}
                className="ml-2"
              >
                <input type="hidden" name="id" value={category.id} />
                <button type="submit" className="rounded-lg border border-[#e7c9c9] px-3 py-1.5 text-xs font-bold text-[#b33636] hover:bg-[#fdeeee]">
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </form>
            </div>
          </div>

          {/* Add Module */}
          {showModuleForm && (
            <div className="mt-4 pt-4 border-t border-[#edf0ef] space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#142238]">Add module to “{category.title}”</h4>
                <p className="mt-1 text-xs text-[#607477]">Paste a shareable link (e.g. Google Drive) to the module PDF.</p>
              </div>
              <form ref={moduleFormRef} action={moduleAction} className="space-y-3">
                <input type="hidden" name="categoryId" value={category.id} />
                <div>
                  <label className="text-xs font-bold text-[#314957] block">Module title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Warning signs"
                    className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#314957] block">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    required
                    placeholder="What will learners cover?"
                    className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#314957] block">Module link (URL)</label>
                  <input
                    name="moduleUrl"
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="mt-1 block w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-[#718181]">Paste a public sharing link. Learners will open it in a new tab.</p>
                </div>
                {moduleState.status !== 'idle' && (
                  <p role="status" className={`flex items-start gap-2 rounded-lg p-2 text-xs font-semibold ${moduleState.status === 'success' ? 'bg-[#e6f5f3] text-[#06625e]' : 'bg-[#fdeeee] text-[#b33636]'}`}>
                    {moduleState.message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={modulePending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#087f78] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  <LinkIcon className="size-3.5" />
                  {modulePending ? 'Adding…' : 'Add module'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModuleForm(false)}
                  className="mt-2 w-full rounded-lg border border-[#cbd9d7] px-4 py-2 text-sm font-bold text-[#607477]"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
          {!showModuleForm && (
            <button
              onClick={() => setShowModuleForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2e0] bg-white px-4 py-2 text-sm font-bold text-[#087f78] hover:bg-[#effafa]"
            >
              <LinkIcon className="size-3.5" /> Add module
            </button>
          )}

          {/* Add Question */}
          {showQuestionForm && (
            <div className="mt-4 pt-4 border-t border-[#edf0ef] space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#142238]">Add practice question to “{category.title}”</h4>
                <p className="mt-1 text-xs text-[#607477]">Learners can answer this question when studying the category.</p>
              </div>
              <form ref={questionFormRef} action={questionAction} className="space-y-3">
                <input type="hidden" name="categoryId" value={category.id} />
                <div>
                  <label className="text-xs font-bold text-[#314957] block">Question</label>
                  <input
                    name="question"
                    type="text"
                    required
                    placeholder="e.g. What does a red circular sign mean?"
                    className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-[#314957] block">Option A</label>
                    <input name="optionA" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#314957] block">Option B</label>
                    <input name="optionB" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#314957] block">Option C</label>
                    <input name="optionC" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#314957] block">Option D</label>
                    <input name="optionD" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#314957] block">Correct answer</label>
                  <select name="correctAnswer" required className="mt-1 w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm">
                    <option value="">Select correct option</option>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                  <p className="mt-1 text-xs text-[#718181]">The correct answer text must match one of the options above.</p>
                </div>
                {questionState.status !== 'idle' && (
                  <p role="status" className={`flex items-start gap-2 rounded-lg p-2 text-xs font-semibold ${questionState.status === 'success' ? 'bg-[#e6f5f3] text-[#06625e]' : 'bg-[#fdeeee] text-[#b33636]'}`}>
                    {questionState.message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={questionPending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#087f78] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  <ShieldCheck className="size-3.5" />
                  {questionPending ? 'Adding…' : 'Add question'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="mt-2 w-full rounded-lg border border-[#cbd9d7] px-4 py-2 text-sm font-bold text-[#607477]"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
          {!showQuestionForm && (
            <button
              onClick={() => setShowQuestionForm(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2e0] bg-white px-4 py-2 text-sm font-bold text-[#087f78] hover:bg-[#effafa]"
            >
              <ShieldCheck className="size-3.5" /> Add practice question
            </button>
          )}

          {/* Category summary */}
          <div className="mt-4 pt-4 border-t border-[#edf0ef]">
            <p className="text-xs font-semibold text-[#607477]">{category.modules.length} module{category.modules.length === 1 ? '' : 's'} · {category.questions.length} question{category.questions.length === 1 ? '' : 's'}</p>
            <Link
              href={`/study?category=${category.id}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#bfcecb] px-3 py-1 text-xs font-bold text-[#087f78] hover:bg-[#effafa]"
            >
              <ArrowRight className="size-3.5" /> View in Study
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}
