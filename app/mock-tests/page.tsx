import type { Metadata } from 'next'
import { requireUser } from '@/lib/session'
import { getMockTests } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Play } from 'lucide-react'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mock Tests | DrivoPrep',
  description: 'Practice with full mock tests and get your results.',
}

export default async function MockTestsPage() {
  await requireUser('/mock-tests')
  const tests = await getMockTests()

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#dbe5e4] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-7 py-4">
          <div>
            <h1 className="text-2xl font-extrabold">Mock Tests</h1>
            <p className="mt-1 text-sm font-semibold text-[#607477]">
              Practice with timed mock tests. Each test is built from uploaded Excel workbooks.
            </p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-7 py-12">
        {tests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-12 text-center">
            <ClipboardList className="mx-auto size-10 text-[#8aa5a1]" />
            <h2 className="mt-3 text-xl font-extrabold text-[#142238]">No mock tests available yet</h2>
            <p className="mt-1 text-sm text-[#607477]">Ask your instructor to upload a mock test from the admin dashboard.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <article
                key={test.id}
                className="rounded-xl border border-[#d8e2e0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
                        <ClipboardList className="size-5" />
                      </span>
                      <h3 className="text-lg font-extrabold text-[#142238] truncate">{test.title}</h3>
                    </div>
                    {test.description && (
                      <p className="mt-1.5 text-sm text-[#607477] line-clamp-2">{test.description}</p>
                    )}
                    <p className="mt-3 text-xs font-semibold text-[#8aa5a1]">
                      {test.questionCount} question{test.questionCount === 1 ? '' : 's'} ·
                      {test.timeLimitMin !== null ? `${test.timeLimitMin} min` : 'No time limit'} ·
                      Pass {test.passMark}%
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-[#718181]">
                      Saved {formatDate(test.createdAt)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/mock-tests/${test.id}/take`}
                  className="mt-4 block w-full rounded-lg bg-[#087f78] px-4 py-3 text-center font-bold text-white hover:bg-[#066a64]"
                >
                  <Play className="mr-2 size-4" /> Start Test
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
