'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock3, List, ShieldCheck, X, CheckCircle2 } from 'lucide-react'
import type { StudyQuestionnaire, StudyQuestionnaireQuestion } from '@/lib/types'

async function fetchQuestionnaire(questionnaireId: string): Promise<StudyQuestionnaire | null> {
  const res = await fetch(`/api/questionnaires/${questionnaireId}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export function QuestionnaireTakePage({ questionnaireId }: { questionnaireId: string }) {
  const [questionnaire, setQuestionnaire] = useState<StudyQuestionnaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const questions = questionnaire?.questions ?? []
  const total = questions.length
  const currentQuestion = questions[current]

  const loadQuestionnaire = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchQuestionnaire(questionnaireId)
      setQuestionnaire(data ?? null)
    } catch {
      setQuestionnaire(null)
    } finally {
      setLoading(false)
    }
  }, [questionnaireId])

  useEffect(() => {
    loadQuestionnaire()
  }, [loadQuestionnaire])

  const selectAnswer = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }))
  }

  const isAnswered = (questionId: string) => !!answers[questionId]
  const getSelected = (questionId: string) => answers[questionId] ?? ''

  // Correct answer is stored as option text (e.g. "Paris"), convert to letter (A/B/C/D) for comparison
  const getCorrectLetter = (q: StudyQuestionnaireQuestion): string | null => {
    const idx = q.options.indexOf(q.correctAnswer)
    return idx >= 0 ? String.fromCharCode(65 + idx) : null
  }

  const correctCount = submitted
    ? questions.reduce((sum, q) => {
        const correctLetter = getCorrectLetter(q)
        return correctLetter && answers[q.id] === correctLetter ? sum + 1 : sum
      }, 0)
    : 0

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6faf9] text-[#142238] flex items-center justify-center">
        <p className="text-sm text-[#607477]">Loading questionnaire…</p>
      </main>
    )
  }

  if (!questionnaire || total === 0) {
    return (
      <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
        <div className="border-b border-[#e3e8e6] bg-white">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-4">
            <div>
              <h1 className="text-2xl font-extrabold">Questionnaire</h1>
              <p className="mt-1 text-sm font-semibold text-[#607477]">This questionnaire has no questions.</p>
            </div>
            <Link href="/study" className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-[1440px] px-7 py-12">
          <div className="rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-10 text-center">
            <List className="mx-auto size-10 text-[#8aa5a1]" />
            <p className="mt-3 text-base font-bold text-[#314957]">No questions available</p>
            <p className="mt-1 text-sm text-[#607477]">Ask your instructor to add questions to this questionnaire.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#e3e8e6] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-4">
          <div className="flex items-center gap-3 text-xl font-extrabold">
            <ShieldCheck className="size-9 text-[#0b7e7a]" />
            <div>
              <h1 className="text-xl font-extrabold">{questionnaire.title}</h1>
              {questionnaire.description && (
                <p className="text-sm text-[#607477]">{questionnaire.description}</p>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 font-bold">
            <Clock3 className="text-[#168e8a]" />
            <span>{submitted ? `${correctCount} / ${total}` : `${current + 1} / ${total}`}</span>
            <Link href="/study" className="hidden rounded-lg border border-[#8eb7b3] px-4 py-2.5 font-semibold text-[#176d6b] sm:block">
              <ArrowLeft className="mr-2 inline size-4" />
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-5 p-5 lg:grid-cols-[280px_1fr]">
        {/* Question grid */}
        <aside className="rounded-xl border border-[#dfe7e6] bg-white p-3">
          <h2 className="font-extrabold text-lg">Questions ({total})</h2>
          <div className="mt-4 grid grid-cols-8 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrent(index)}
                className={`rounded-md border px-1 py-1 text-xs font-bold transition-colors ${
                  submitted
                    ? getCorrectLetter(q) === answers[q.id]
                      ? 'border-[#10b981] bg-[#dcfce7] text-[#166534]'
                      : 'border-[#ef4444] bg-[#fee2e2] text-[#991b1b]'
                    : index === current
                      ? 'border-[#e5bc45] bg-[#fff8da]'
                      : isAnswered(q.id)
                        ? 'border-[#bce3df] bg-[#e6f5f3] text-[#106c69]'
                        : 'border-[#dbe8e6] bg-white text-[#116c69]'
                }`}
              >
                Q{index + 1}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-[#f3faf9] p-3 text-xs leading-5">
            <List className="mr-2 inline size-5 text-[#1fa39d]" />
            <b>Tip:</b> You can jump between questions anytime.
          </div>
        </aside>

        {/* Question panel */}
        <div>
          {!submitted ? (
            <>
              <div className="mb-4 flex justify-end gap-3">
                {current === total - 1 ? (
                  <button onClick={() => setSubmitted(true)} className="rounded-lg bg-[#cf2638] px-4 py-2.5 font-semibold text-white">
                    Submit questionnaire
                  </button>
                ) : (
                  <>
                    <Link href="/study" className="rounded-lg border border-[#8eb7b3] px-4 py-2.5 font-semibold text-[#176d6b]">
                      Back
                    </Link>
                    <button
                      onClick={() => setCurrent((c) => Math.min(c + 1, total - 1))}
                      disabled={!isAnswered(currentQuestion.id)}
                      className={`rounded-lg px-4 py-2.5 font-semibold text-white transition ${
                        !isAnswered(currentQuestion.id)
                          ? 'bg-[#cbd5d0] cursor-not-allowed'
                          : 'bg-[#168f82]'
                      }`}
                    >
                      Next
                    </button>
                  </>
                )}
              </div>
              <section className="rounded-xl border border-[#dfe7e6] bg-white p-7">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-[#e6f5f3] px-3 py-1 text-xs font-bold uppercase text-[#168f82]">
                    Question {current + 1}
                  </span>
                  <span className="text-xs font-bold uppercase text-[#168f82]">{questionnaire.title}</span>
                </div>
                <h2 className="mt-4 text-2xl font-extrabold leading-tight">{currentQuestion.question}</h2>
                <div className="mt-8 space-y-3">
                  {currentQuestion.options.map((option, i) => {
                    const letter = String.fromCharCode(65 + i)
                    const selected = getSelected(currentQuestion.id)
                    return (
                      <label
                        key={option}
                        onClick={() => selectAnswer(letter)}
                        className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                          selected === letter
                            ? 'border-[#168f82] bg-[#e6f5f3]'
                            : 'border-[#d8e2e0] bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          readOnly
                          checked={selected === letter}
                          className="size-5 accent-[#168f82]"
                        />
                        <span className="font-semibold">{option}</span>
                      </label>
                    )
                  })}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-xl border border-[#dfe7e6] bg-white p-7 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle2 className="size-8 text-[#168f82]" />
                <h2 className="text-2xl font-extrabold text-[#142238]">Questionnaire complete</h2>
              </div>
              <p className="text-4xl font-extrabold text-[#168f82]">
                {correctCount} / {total}
              </p>
              <p className="mt-2 text-sm text-[#607477]">
                {Math.round((correctCount / total) * 100)}% correct
              </p>
              <div className="mt-6 space-y-3">
                {questions.map((q) => {
                  const userAnswer = answers[q.id]
                  const correctLetter = getCorrectLetter(q)
                  const isCorrect = userAnswer === correctLetter
                  const userOptionIndex = userAnswer ? userAnswer.charCodeAt(0) - 65 : -1
                  const correctOptionIndex = correctLetter ? correctLetter.charCodeAt(0) - 65 : -1
                  return (
                    <div key={q.id} className="text-left rounded-lg border p-3 animate-in fade-in slide-in-from-right-1 duration-300">
                      <p className="text-sm font-semibold text-[#3d5153] mb-2">{q.question}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-bold ${isCorrect ? 'text-[#166534]' : 'text-[#991b1b]'}`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                        {!isCorrect && (
                          <>
                            <span className="text-[#607477]">Your answer:</span>
                            <span className="text-[#991b1b]">{userAnswer ? `${userAnswer}. ${q.options[userOptionIndex]}` : 'No answer'}</span>
                            <span className="text-[#607477] ml-2">Correct:</span>
                            <span className="text-[#166534]">{`${correctLetter}. ${q.options[correctOptionIndex]}`}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex gap-3 justify-center">
                <Link
                  href="/study"
                  className="rounded-lg border border-[#8eb7b3] px-4 py-2.5 font-semibold text-[#176d6b]"
                >
                  Back to study
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setAnswers({})
                    setCurrent(0)
                  }}
                  className="rounded-lg bg-[#168f82] px-4 py-2.5 font-semibold text-white"
                >
                  Retake
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
