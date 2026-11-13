'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import type { PracticeTopic } from '@/lib/types'

async function fetchPracticeTopics(): Promise<PracticeTopic[]> {
  const res = await fetch('/api/practice/topics', { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export function PracticePage() {
  const [topics, setTopics] = useState<PracticeTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPracticeTopics()
      .then(setTopics)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6faf9] text-[#142238] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#e6f5f3] border-t-[#087f78] animate-spin"></div>
          <h2 className="mt-6 text-lg font-extrabold text-[#142238]">Loading practice questions…</h2>
          <p className="mt-2 text-sm text-[#607477]">Please wait while we load your practice topics.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#e3e8e6] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#142238]">Practice Questions</h1>
            <p className="mt-1 text-sm font-semibold text-[#607477]">Choose a topic to start practicing.</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-7 py-12">
        {topics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-10 text-center">
            <FileText className="mx-auto size-10 text-[#8aa5a1]" />
            <p className="mt-3 text-base font-bold text-[#314957]">No practice topics available yet</p>
            <p className="mt-1 text-sm text-[#607477]">Ask your instructor to import practice questions from the admin dashboard.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <article key={topic.id} className="overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md border-[#d8e2e0] bg-white">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-extrabold text-[#142238]">{topic.title}</h3>
                      {topic.description && (
                        <p className="mt-1.5 text-sm leading-5 text-[#607477]">{topic.description}</p>
                      )}
                      <p className="mt-3 text-xs font-semibold text-[#8aa5a1]">
                        {topic.questions.length} question{topic.questions.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Link
                      href={`/practice/${topic.id}/take`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#087f78] px-4 py-2 text-sm font-bold text-white hover:bg-[#066a64]"
                    >
                      Start practice
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
