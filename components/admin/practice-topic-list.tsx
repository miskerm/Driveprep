'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { deletePracticeTopicAction } from '@/app/admin/practice/actions'
import type { PracticeTopic } from '@/lib/types'

export function PracticeTopicList({ topics }: { topics: PracticeTopic[] }) {
  const [deleting, setDeleting] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <div key={topic.id} className="rounded-lg border border-[#e3e8e6] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-extrabold text-[#142238]">{topic.title}</h4>
              {topic.description && (
                <p className="mt-1 text-xs text-[#607477]">{topic.description}</p>
              )}
              <p className="mt-1 text-xs font-semibold text-[#8aa5a1]">
                {topic.questions.length} question{topic.questions.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/practice?topic=${topic.id}`}
                className="rounded-lg border border-[#bfcecb] px-3 py-1.5 text-xs font-bold text-[#087f78] hover:bg-[#effafa]"
              >
                Preview
              </Link>
              <form
                onSubmit={(e) => {
                  if (
                    !window.confirm(
                      `Delete “${topic.title}” practice topic? This removes all its questions and cannot be undone.`,
                    )
                  ) {
                    e.preventDefault()
                  }
                }}
                action={deletePracticeTopicAction}
                className="ml-2"
              >
                <input type="hidden" name="id" value={topic.id} />
                <button
                  type="submit"
                  disabled={deleting === topic.id}
                  className="rounded-lg border border-[#e7c9c9] px-3 py-1.5 text-xs font-bold text-[#b33636] hover:bg-[#fdeeee]"
                >
                  {deleting === topic.id ? 'Deleting…' : <Trash2 className="size-3.5" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
