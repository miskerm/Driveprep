'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Play, RefreshCw, ShieldCheck } from 'lucide-react'
import { generateMockTestsAction } from '@/app/admin/mock-tests/actions'

export function GenerateMockTestsForm() {
  const [generateState, generateAction, generating] = useActionState(
    generateMockTestsAction,
    { status: 'idle', message: '' } as { status: 'idle' | 'success' | 'error'; message: string },
  )
  const [showGenerated, setShowGenerated] = useState(false)

  return (
    <section className="mb-8 rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-[#fff8e6] text-[#d79a0b]">
            <RefreshCw className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#142238]">Generate Mock Tests from Questionnaires</h2>
            <p className="mt-1 text-sm text-[#607477]">
              Extract questions from all imported study questionnaires, shuffle them, and create three 100-question
              mock tests (Mock Test 1, 2, 3) with a 30-minute time limit each.
            </p>
          </div>
        </div>
      </div>

      <form action={generateAction} className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={generating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d79a0b] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className="size-4" />
          {generating ? 'Generating…' : 'Generate 3 Mock Tests (100 questions each)'}
        </button>
        {generateState.status === 'success' && (
          <p className="flex items-start gap-2 rounded-lg p-3 text-sm font-semibold bg-[#e6f5f3] text-[#06625e]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            {generateState.message}
          </p>
        )}
        {generateState.status === 'error' && (
          <p className="flex items-start gap-2 rounded-lg p-3 text-sm font-semibold bg-[#fdeeee] text-[#b33636]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            {generateState.message}
          </p>
        )}
      </form>
    </section>
  )
}
