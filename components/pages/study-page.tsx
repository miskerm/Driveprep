'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, BookOpen, FileText, ShieldCheck, ExternalLink } from 'lucide-react'
import type { StudyCategory } from '@/lib/types'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function StudyPage({ categories }: { categories: StudyCategory[] }) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-[#e3e8e6] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-4">
          <div>
            <h1 className="text-2xl font-extrabold">Study Materials</h1>
            <p className="mt-1 text-sm font-semibold text-[#607477]">Select a category to view its modules and practice questions.</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-7 py-12">
        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-10 text-center">
            <FileText className="mx-auto size-10 text-[#8aa5a1]" />
            <p className="mt-3 text-base font-bold text-[#314957]">No study categories yet</p>
            <p className="mt-1 text-sm text-[#607477]">Ask your instructor to add study categories from the admin dashboard.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.id}
                className={`overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md ${
                  openCategory === category.id
                    ? 'border-[#087f78] ring-1 ring-[#087f78]'
                    : 'border-[#d8e2e0] bg-white'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
                          <BookOpen className="size-5" />
                        </span>
                        <h3 className="text-lg font-extrabold text-[#142238]">{category.title}</h3>
                      </div>
                      {category.description && (
                        <p className="mt-1.5 text-sm leading-5 text-[#607477]">{category.description}</p>
                      )}
                      <p className="mt-3 text-xs font-semibold text-[#8aa5a1]">
                        {category.modules.length} module{category.modules.length === 1 ? '' : 's'} ·
                        {category.questions.length} question{category.questions.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                      className={`rounded-lg p-2 transition ${openCategory === category.id ? 'bg-[#e6f5f3] text-[#087f78]' : 'bg-[#f3f6f5] text-[#3d5153]'}`}
                      aria-label={openCategory === category.id ? 'Close category' : 'Open category'}
                    >
                      {openCategory === category.id ? (
                        <ShieldCheck className="size-4" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {openCategory === category.id && (
                  <div className="bg-[#fbfdfc] border-t border-[#edf0ef] p-5">
                    {category.modules.length > 0 && (
                      <>
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#087f78]">Modules</span>
                        </div>
                        <div className="space-y-2">
                          {category.modules.map((module) => (
                            <div
                              key={module.id}
                              className="flex items-center gap-3 rounded-lg border border-[#edf0ef] bg-white p-3"
                            >
                              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
                                <BookOpen className="size-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[#142238] truncate">{module.title}</p>
                                {module.description && (
                                  <p className="text-xs text-[#607477] truncate">{module.description}</p>
                                )}
                                <p className="text-xs text-[#607477]">Added {formatDate(module.createdAt)}</p>
                              </div>
                              {module.fileUrl ? (
                                <a
                                  href={module.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#168f82] px-3 py-1.5 text-xs font-bold text-white"
                                >
                                  Open module <ExternalLink className="size-3.5" />
                                </a>
                              ) : (
                                <span className="text-xs font-bold text-[#8aa5a1]">No link</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {category.questions.length > 0 && (
                      <>
                        {category.modules.length > 0 && <div className="mt-6 h-px bg-[#e3e8e6]" />}
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#087f78]">Practice questions</span>
                          <span className="ml-auto text-xs font-semibold text-[#087f78]">
                            {category.questions.length} question{category.questions.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {category.questions.map((question) => (
                            <div key={question.id} className="rounded-lg border border-[#edf0ef] bg-white p-3">
                              <div className="flex items-start gap-3">
                                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff3d6] text-[#9a6a05]">
                                  <ShieldCheck className="size-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-5 text-[#3d5153]">{question.question}</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#607477]">Options:</span>
                                    {question.options.map((opt, i) => (
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
                      </>
                    )}

                    {category.modules.length === 0 && category.questions.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-4 text-center">
                        <p className="text-sm text-[#607477]">This category is empty. Add modules and questions from the admin dashboard.</p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
