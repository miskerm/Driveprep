'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useProgress } from '@/components/providers'
import type { PracticeTopic, PracticeQuestion } from '@/lib/types'

export function PracticeTakePage({ topicId }: { topicId: string }) {
  const [topics, setTopics] = useState<PracticeTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionAnswered, setSessionAnswered] = useState(0)
  const { recordAnswer, recordResult, notify } = useProgress()
  const router = useRouter()

  const activeTopic = topics.find((t) => t.id === topicId)
  const questions = activeTopic?.questions ?? []
  const q = questions[current - 1]

  useEffect(() => {
    fetch('/api/practice/topics', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: PracticeTopic[]) => {
        setTopics(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6faf9] text-[#142238] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex items-center justify-center w-full h-1/2">
              <svg className="animate-spin h-8 w-8 text-[#087f78]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-1.208 1.208.707.707L12 20v-4.586L7.646 11.293l.707-.707L10.586 10z"></path>
              </svg>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#e6f5f3] border-t-[#087f78] animate-spin"></div>
            </div>
            <h2 className="mt-6 text-lg font-extrabold text-[#142238]">Loading questions…</h2>
            <p className="mt-2 text-sm text-[#607477]">Please wait while we load your practice questions.</p>
          </div>
        </div>
      </main>
    )
  }

  const answerQuestion = (option: string) => {
    const qId = String(q.position)
    if (qId in answers) return
    const isCorrect = option === q.correctAnswer
    setAnswers((prev) => ({ ...prev, [qId]: option }))
    setSessionAnswered((count) => count + 1)
    if (isCorrect) setSessionCorrect((count) => count + 1)
    recordAnswer(activeTopic!.title, q.id, isCorrect)
  }

  const total = questions.length
  const isCorrectAnswer = q ? String(q.position) in answers && answers[String(q.position)] === q.correctAnswer : false

  const goBack = () => {
    router.push('/dashboard')
  }

  const finishSession = () => {
    const score = Math.round((sessionCorrect / total) * 100)
    recordResult(`Practice - ${activeTopic!.title}`, score)
    notify('completed', `You completed the ${activeTopic!.title} topic`, `Good job! You scored ${score}% (${sessionCorrect} of ${total} correct).`)
    router.push('/dashboard')
  }

  if (!activeTopic || questions.length === 0 || !q) {
    return (
      <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
        <div className="border-b border-[#e3e8e6] bg-white">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-4">
            <h1 className="text-2xl font-extrabold text-[#142238]">Practice Questions</h1>
            <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-[1000px] px-7 py-12">
          <div className="rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-10 text-center">
            <p className="mt-3 text-base font-bold text-[#314957]">No practice questions available yet</p>
            <p className="mt-1 text-sm text-[#607477]">Ask your instructor to import practice questions from the admin dashboard.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#e3e8e6] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-9 text-[#087f78]" />
            <div>
              <h1 className="text-xl font-extrabold text-[#142238]">{activeTopic.title}</h1>
              <p className="mt-1 text-sm text-[#607477]">{activeTopic.description || 'Practice questions'}</p>
            </div>
          </div>
          <Link href="/practice" className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-7 py-12">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Question grid sidebar */}
          <aside className="rounded-xl border border-[#dfe7e6] bg-white p-3">
            <h2 className="font-extrabold text-lg">Questions ({total})</h2>
            <div className="mt-4 grid grid-cols-8 gap-2">
              {questions.map((q, index) => {
                const qId = String(q.position)
                const isAnswered = qId in answers
                const isCorrect = qId in answers && answers[qId] === q.correctAnswer
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(q.position)}
                    className={`rounded-md border px-1 py-1 text-xs font-bold transition-colors ${
                      index === current - 1
                        ? 'border-[#e5bc45] bg-[#fff8da]'
                        : isAnswered
                          ? isCorrect
                            ? 'border-[#10b981] bg-[#dcfce7] text-[#166534]'
                            : 'border-[#ef4444] bg-[#fee2e2] text-[#991b1b]'
                          : 'border-[#dbe8e6] bg-white text-[#116c69]'
                    }`}
                  >
                    Q{q.position}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 rounded-lg border border-[#e3e8e6] bg-[#f8fbfa] p-3 text-xs text-[#607477]">
              <p className="text-sm font-semibold text-[#142238]">{sessionAnswered} / {total} answered</p>
            </div>
          </aside>

          {/* Question panel */}
          <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wide text-[#06625e]">{activeTopic.title} · Question {current} of {total}</p>
            <h2 className="mt-4 text-pretty text-2xl font-extrabold leading-snug text-[#142238] sm:text-3xl">{q.question}</h2>
            <div className="mt-8 flex flex-col gap-3">
              {q.options.map((option) => {
                const qId = String(q.position)
                const showCorrect = qId in answers && option === q.correctAnswer
                const showWrong = qId in answers && answers[qId] === option && option !== q.correctAnswer
                return (
                  <button key={option} onClick={() => answerQuestion(option)} disabled={qId in answers} className={`flex w-full items-center justify-between gap-4 rounded-lg border-2 p-4 text-left text-lg font-semibold leading-relaxed text-[#142238] transition ${showCorrect ? 'border-[#10b981] bg-[#dcfce7]' : showWrong ? 'border-[#ef4444] bg-[#fee2e2]' : 'border-[#d8e2e0] bg-white hover:border-[#168f82] hover:bg-[#f3fbf9]'} disabled:cursor-default`}>
                    <span>{option}</span>
                    {showCorrect && <CheckCircle2 className="size-6 shrink-0 text-[#06625e]" aria-label="Correct answer" />}
                    {showWrong && <XCircle className="size-6 shrink-0 text-[#991b1b]" aria-label="Incorrect answer" />}
                  </button>
                )
              })}
            </div>
            {String(q.position) in answers && (
              <div role="status" className={`mt-8 rounded-lg border p-4 ${isCorrectAnswer ? 'border-[#10b981] bg-[#dcfce7]/20' : 'border-[#ef4444] bg-[#fee2e2]/20'}`}>
                <div className="flex items-start gap-2">
                  {isCorrectAnswer ? (
                    <>
                      <CheckCircle2 className="mt-0.5 size-5 text-[#06625e]" />
                      <span className="text-lg font-bold text-[#06625e]">Correct answer.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="mt-0.5 size-5 text-[#991b1b]" />
                      <span className="text-lg font-bold text-[#991b1b]">Incorrect answer.</span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-base leading-relaxed text-[#142238]">The correct answer is: <strong className="text-[#06625e]">{q.correctAnswer}</strong></p>
              </div>
            )}
            {String(q.position) in answers && current < total && <button onClick={() => { setCurrent(current + 1); setAnswers({}) }} className="mt-6 w-full rounded-lg bg-[#087f78] px-4 py-3 text-lg font-bold text-white">Next Question</button>}
            {String(q.position) in answers && current === total && <button onClick={finishSession} className="mt-6 w-full rounded-lg bg-[#087f78] px-4 py-3 text-lg font-bold text-white">Complete &amp; Go Back</button>}
          </div>
        </div>
      </div>
    </main>
  )
}
