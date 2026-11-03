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
  List,
  Upload,
  Download,
  AlertTriangle,
} from 'lucide-react'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createModuleAction,
  deleteModuleAction,
  importCategoryExcelAction,
  saveCategoryExcelQuestionsAction,
  deleteQuestionnaireAction,
} from '@/app/admin/modules/actions'
import type {
  CategoryFormState,
  ModuleFormState,
  StudyCategory,
  StudyQuestionnaire,
} from '@/lib/types'
import type {
  CategoryExcelImportState,
  CategoryExcelSaveState,
  ParsedMockQuestion,
} from '@/lib/mock-types'

const initialCategoryState: CategoryFormState = { status: 'idle', message: '' }
const initialModuleState: ModuleFormState = { status: 'idle', message: '' }
const initialImportState: CategoryExcelImportState = {
  status: 'idle',
  message: '',
  questions: [],
  warnings: [],
  suggestedTitle: '',
  fileName: '',
  categoryId: '',
}
const initialSaveState: CategoryExcelSaveState = { status: 'idle', message: '' }

function formatBytes(bytes: number) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
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
            <p className="mt-1 text-sm text-[#607477]">A category groups modules and imported question sets together.</p>
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
  const [importState, importAction, importing] = useActionState(importCategoryExcelAction, initialImportState)
  const [saveState, saveAction, saving] = useActionState(saveCategoryExcelQuestionsAction, initialSaveState)
  const moduleFormRef = useRef<HTMLFormElement>(null)
  const importFormRef = useRef<HTMLFormElement>(null)
  const saveFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (moduleState.status === 'success') moduleFormRef.current?.reset()
  }, [moduleState])
  useEffect(() => {
    if (importState.status === 'success') importFormRef.current?.reset()
  }, [importState])
  useEffect(() => {
    if (saveState.status === 'success') saveFormRef.current?.reset()
  }, [saveState])

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(category.title)
  const [editDesc, setEditDesc] = useState(category.description ?? '')
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [showImportReview, setShowImportReview] = useState(false)

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
                {category.questionnaires.length} question set{category.questionnaires.length === 1 ? '' : 's'} ·
                {category.questions.length} practice question{category.questions.length === 1 ? '' : 's'}
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
                  if (!window.confirm(`Delete “${category.title}” category? This removes all its modules, question sets, and questions and cannot be undone.`)) {
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

          {/* Import Questions from Excel */}
          {showImportForm && (
            <div className="mt-4 pt-4 border-t border-[#edf0ef] space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#142238]">Import questions from Excel to “{category.title}”</h4>
                <p className="mt-1 text-xs text-[#607477]">
                  Upload a workbook and the questions are read in sheet order, row by row. Each import becomes its own
                  numbered question set under this category.
                </p>
              </div>

              {importState.status === 'success' && importState.questions.length > 0 && !showImportReview ? (
                <>
                  <div className="rounded-lg border border-[#dbe8e6] bg-[#f8fbfa] p-3 text-xs leading-5 text-[#3d5153]">
                    <p className="font-bold text-[#142238]">Questions read from Excel</p>
                    <p className="mt-1">
                      {importState.questions.length} question{importState.questions.length === 1 ? '' : 's'} found in{" "}
                      <code className="rounded bg-white px-1 py-0.5">{importState.fileName}</code>, in Excel order.
                    </p>
                  </div>

                  <form ref={saveFormRef} action={saveAction} className="space-y-3">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input type="hidden" name="questions" value={JSON.stringify(importState.questions)} />
                    <input type="hidden" name="fileName" value={importState.fileName} />

                    <div>
                      <label className="text-xs font-bold text-[#314957] block">Question set title</label>
                      <input
                        name="title"
                        type="text"
                        required
                        defaultValue={importState.suggestedTitle || importState.fileName.replace(/\.(xlsx|xls|csv)$/i, '')}
                        placeholder="e.g. Road Signs Quiz 1"
                        className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#314957] block">Description (optional)</label>
                      <textarea
                        name="description"
                        rows={2}
                        placeholder="What does this question set cover?"
                        className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                      />
                    </div>

                    {saveState.status !== 'idle' && (
                      <p role="status" className={`flex items-start gap-2 rounded-lg p-2 text-xs font-semibold ${saveState.status === 'success' ? 'bg-[#e6f5f3] text-[#06625e]' : 'bg-[#fdeeee] text-[#b33636]'}`}>
                        {saveState.status === 'success' && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
                        {saveState.message}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#087f78] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <SaveIcon className="size-3.5" />
                        {saving ? 'Saving…' : 'Save question set'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImportForm(false)}
                        className="mt-2 w-full rounded-lg border border-[#cbd9d7] px-4 py-2 text-sm font-bold text-[#607477]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              ) : null}

              {!importState.status || importState.status === 'idle' || importState.status === 'error' ? (
                <form ref={importFormRef} action={importAction} className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input
                    name="categoryExcel"
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    required
                    className="block w-full flex-1 cursor-pointer rounded-lg border border-[#cbd9d7] bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#fff1ed] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[#c24834]"
                  />
                  <button
                    type="submit"
                    disabled={importing}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ef6a57] px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="size-4" />
                    {importing ? 'Reading…' : 'Read Excel'}
                  </button>
                  <a
                    href="/api/admin/mock-template"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-3 py-2 text-xs font-bold text-[#087f78]"
                  >
                    <Download className="size-4" />
                    Download template
                  </a>
                </form>
              ) : null}

              {importState.status === 'error' && importState.message && (
                <p role="status" className="flex items-start gap-2 rounded-lg p-2 text-xs font-semibold bg-[#fdeeee] text-[#b33636]">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {importState.message}
                </p>
              )}

              {importState.warnings.length > 0 && (
                <div className="mt-3 rounded-lg border border-[#f2dfac] bg-[#fffaf0] p-3 text-xs leading-5 text-[#8a6410]">
                  <p className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="size-4" />
                    Import notes
                  </p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                    {importState.warnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!showImportForm && (
            <button
              onClick={() => {
                setShowImportForm(true)
                setShowImportReview(false)
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2e0] bg-white px-4 py-2 text-sm font-bold text-[#087f78] hover:bg-[#effafa]"
            >
              <Upload className="size-3.5" /> Import questions from Excel
            </button>
          )}

          {/* Imported question sets */}
          {category.questionnaires.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#edf0ef] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#142238]">Question sets</h4>
                <span className="text-xs font-semibold text-[#607477]">
                  {category.questionnaires.length} question set{category.questionnaires.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
                {category.questionnaires.map((questionnaire) => (
                  <QuestionSetCard key={questionnaire.id} questionnaire={questionnaire} />
                ))}
              </div>
            </div>
          )}

          {/* Category summary */}
          <div className="mt-4 pt-4 border-t border-[#edf0ef]">
            <p className="text-xs font-semibold text-[#607477]">
              {category.modules.length} module{category.modules.length === 1 ? '' : 's'} ·
              {category.questionnaires.length} question set{category.questionnaires.length === 1 ? '' : 's'} ·
              {category.questions.length} practice question{category.questions.length === 1 ? '' : 's'}
            </p>
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

function SaveIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.className ? undefined : 24}
      height={props.className ? undefined : 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

interface QuestionSetCardProps {
  questionnaire: StudyQuestionnaire
}

function QuestionSetCard({ questionnaire }: QuestionSetCardProps) {
  return (
    <article className="rounded-xl border border-[#e3e8e6] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-[#fff8e6] text-[#d79a0b]">
              <List className="size-5" />
            </span>
            <h4 className="text-base font-extrabold text-[#142238]">{questionnaire.title}</h4>
          </div>
          {questionnaire.description && (
            <p className="mt-1 text-sm text-[#607477]">{questionnaire.description}</p>
          )}
          <p className="mt-2 text-xs font-semibold text-[#8aa5a1]">
            {questionnaire.questionCount} question{questionnaire.questionCount === 1 ? '' : 's'} · in Excel order
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              if (!window.confirm(`Delete “${questionnaire.title}” question set? This removes all its questions and cannot be undone.`)) {
                e.preventDefault()
              }
            }}
            action={deleteQuestionnaireAction}
            className="ml-2"
          >
            <input type="hidden" name="id" value={questionnaire.id} />
            <button type="submit" className="rounded-lg border border-[#e7c9c9] px-3 py-1.5 text-xs font-bold text-[#b33636] hover:bg-[#fdeeee]">
              <Trash2 className="size-3.5" /> Delete
            </button>
          </form>
        </div>
      </div>

      {questionnaire.questions.length > 0 && (
        <div className="mt-3 space-y-2">
          {questionnaire.questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-[#edf0ef] bg-white p-3">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff3d6] text-[#9a6a05]">
                  <ShieldCheck className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 text-[#3d5153]">{q.question}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#607477]">Options:</span>
                    {q.options.map((opt, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full border border-[#d8e2e0] px-2 py-0.5 text-[10px] font-bold text-[#142238]">
                        {String.fromCharCode(65 + i)}. {opt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
