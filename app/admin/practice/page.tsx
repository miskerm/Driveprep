import { PracticeImportForm } from '@/components/admin/practice-import-form'
import { PracticeTopicList } from '@/components/admin/practice-topic-list'
import { getPracticeTopics } from '@/lib/db'
import Link from 'next/link'

export default async function AdminPracticePage() {
  const savedTopics = await getPracticeTopics()

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#168f82]">
            Practice content
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">Add Practice Questions</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#607477]">
            Import practice questions from Excel using the same template as questionnaires, or create practice
            topics manually. Questions are stored in the database and shown to learners on the practice page.
          </p>
        </div>
        <Link
          href="/admin/modules"
          className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold text-[#087f78]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Manage categories
        </Link>
      </header>

      <section className="mb-8 rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#fff8e6] text-[#d79a0b]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[#142238]">
                Import Practice Questions from Excel
              </h2>
              <p className="mt-1 text-sm text-[#607477]">
                Upload a workbook and questions are read in sheet order, row by row. Each import becomes part of a
                practice topic. Use the same template as questionnaires.
              </p>
            </div>
          </div>
          <a
            href="/api/admin/mock-template"
            className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-3 py-2 text-xs font-bold text-[#087f78]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download template
          </a>
        </div>

        <div className="mt-5 rounded-lg border border-[#dbe8e6] bg-[#f8fbfa] p-4 text-xs leading-5 text-[#3d5153]">
          <p className="font-bold text-[#142238]">Expected layout</p>
          <p className="mt-1">
            <code className="rounded bg-white px-1 py-0.5">Question</code>{' '}
            <code className="rounded bg-white px-1 py-0.5">Option A</code>{' '}
            <code className="rounded bg-white px-1 py-0.5">Option B</code>{' '}
            <code className="rounded bg-white px-1 py-0.5">Option C</code>{' '}
            <code className="rounded bg-white px-1 py-0.5">Option D</code>{' '}
            <code className="rounded bg-white px-1 py-0.5">Correct Answer</code>{' '}
            <code className="rounded bg-white px-1 py-0.5">Explanation</code>
          </p>
          <p className="mt-1.5">
            The correct answer can be a letter (A-D), a number (1-4), or the exact option text. Headers are optional
            when the columns follow this order. .xlsx, .xls, and .csv are accepted.
          </p>
        </div>

        <PracticeImportForm />
      </section>

      <section className="mb-8 rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#142238]">
              Existing practice topics
            </h2>
            <p className="mt-1 text-sm text-[#607477]">
              {savedTopics.length} topic{savedTopics.length === 1 ? '' : 's'} available for learners.
            </p>
          </div>
        </div>

        {savedTopics.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-[#8aa5a1]"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <p className="mt-3 text-sm font-bold text-[#314957]">No practice topics yet</p>
            <p className="mt-1 text-xs text-[#718181]">
              Import your first Excel file above to create a practice topic.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <PracticeTopicList topics={savedTopics} />
          </div>
        )}
      </section>
    </main>
  )
}
