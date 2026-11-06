'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock3, List, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import type { StudyQuestionnaire, StudyQuestionnaireQuestion } from '@/lib/types'

async function fetchQuestionnaire(questionnaireId: string): Promise<StudyQuestionnaire | null> {
  const res = await fetch(`/api/questionnaires/${questionnaireId}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
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

  // Correct answer is stored as option text (e.g. "Paris"), convert to letter (A/B/C/D) for comparison
  const getCorrectLetter = (q: StudyQuestionnaireQuestion): string | null => {
    const idx = q.options.indexOf(q.correctAnswer)
    return idx >= 0 ? String.fromCharCode(65 + idx) : null
  }

  const isAnswered = (questionId: string) => !!answers[questionId]
  const getSelected = (questionId: string) => answers[questionId] ?? ''

  const correctCount = questions.reduce((sum, q) => {
    const correctLetter = getCorrectLetter(q)
    return correctLetter && answers[q.id] === correctLetter ? sum + 1 : sum
  }, 0)

  const allAnswered = questions.every((q) => isAnswered(q.id))

  const selectAnswer = (option: string) => {
    if (isAnswered(currentQuestion.id)) return // lock: already answered
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }))
  }

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

  const currentCorrectLetter = getCorrectLetter(currentQuestion)
  const currentUserAnswer = answers[currentQuestion.id]
  const currentIsCorrect = currentUserAnswer === currentCorrectLetter
  const currentUserOptionIndex = currentUserAnswer ? currentUserAnswer.charCodeAt(0) - 65 : -1
  const currentCorrectOptionIndex = currentCorrectLetter ? currentCorrectLetter.charCodeAt(0) - 65 : -1

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
            {questions.map((q, index) => {
              const answered = isAnswered(q.id)
              const correctLetter = getCorrectLetter(q)
              const isCorrect = answered && correctLetter && answers[q.id] === correctLetter
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrent(index)}
                  className={`rounded-md border px-1 py-1 text-xs font-bold transition-colors ${
                    index === current
                      ? answered
                        ? isCorrect
                          ? 'border-[#10b981] bg-[#dcfce7] text-[#166534]'
                          : 'border-[#ef4444] bg-[#fee2e2] text-[#991b1b]'
                        : 'border-[#e5bc45] bg-[#fff8da]'
                      : answered
                        ? isCorrect
                          ? 'border-[#10b981] bg-[#dcfce7] text-[#166534]'
                          : 'border-[#ef4444] bg-[#fee2e2] text-[#991b1b]'
                        : 'border-[#dbe8e6] bg-white text-[#116c69]'
                  }`}
                >
                  Q{index + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-5 rounded-lg bg-[#f3faf9] p-3 text-xs leading-5">
            <List className="mr-2 inline size-5 text-[#1fa39d]" />
            <b>Tip:</b> Select an answer to see instant feedback. Each question locks once answered.
          </div>
        </aside>

        {/* Question panel */}
        <div>
          {!submitted ? (
            <>
              <div className="mb-4 flex justify-end gap-3">
                {current === total - 1 ? (
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={!isAnswered(currentQuestion.id)}
                    className={`rounded-lg px-4 py-2.5 font-semibold text-white transition ${
                      !isAnswered(currentQuestion.id)
                        ? 'bg-[#cbd5d0] cursor-not-allowed'
                        : 'bg-[#cf2638]'
                    }`}
                  >
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
                    const isSelected = selected === letter
                    const isCorrect = currentCorrectLetter === letter
                    const answered = isAnswered(currentQuestion.id)

                    // Determine styling based on answer state
                    let optionClass = 'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors duration-300'
                    let icon: React.ReactNode = null

                    if (answered) {
                      if (isSelected && isCorrect) {
                        optionClass += ' border-[#10b981] bg-[#dcfce7]'
                        icon = <CheckCircle2 className="size-5 text-[#166534]" />
                      } else if (isSelected && !isCorrect) {
                        optionClass += ' border-[#ef4444] bg-[#fee2e2]'
                        icon = <XCircle className="size-5 text-[#991b1b]" />
                      } else if (isCorrect) {
                        optionClass += ' border-[#10b981] bg-[#dcfce7]/50'
                        icon = <CheckCircle2 className="size-5 text-[#166534]" />
                      } else {
                        optionClass += ' border-[#d8e2e0] bg-white opacity-60'
                      }
                    } else if (isSelected) {
                      optionClass += ' border-[#168f82] bg-[#e6f5f3]'
                    }

                    return (
                      <label
                        key={option}
                        onClick={() => selectAnswer(letter)}
                        className={optionClass}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          readOnly
                          disabled={answered}
                          checked={isSelected}
                          className="size-5 accent-[#168f82]"
                        />
                        <span className="font-semibold">{option}</span>
                        {icon && <span className="ml-auto">{icon}</span>}
                      </label>
                    )
                  })}
                </div>

                {/* Instant feedback + explanation (shown after answering) */}
                {isAnswered(currentQuestion.id) && currentCorrectLetter && (
                  <div className="mt-6 rounded-lg p-4 transition-all duration-300">
                    {currentIsCorrect ? (
                      <div className="border border-[#10b981] bg-[#dcfce7] rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 size-5 text-[#166534] shrink-0" />
                          <div>
                            <h3 className="font-bold text-[#166534] text-sm">Correct! Well done.</h3>
                            <p className="mt-1 text-sm text-[#166534]">
                              {`“${currentQuestion.options[currentUserOptionIndex]}” is the correct answer.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-[#ef4444] bg-[#fee2e2] rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="mt-0.5 size-5 text-[#991b1b] shrink-0" />
                          <div>
                            <h3 className="font-bold text-[#991b1b] text-sm">
                              Incorrect. Don&apos;t worry, learn from the explanation below.
                            </h3>
                            <p className="mt-1 text-sm text-[#991b1b]">
                              {`“${currentQuestion.options[currentUserOptionIndex]}” is not the correct answer.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explanation section */}
                    {currentQuestion.explanation && currentQuestion.explanation.trim() !== '' && (
                      <div className="mt-4 rounded-lg border border-[#e3e8e6] bg-[#f8fafc] p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle className="size-4 text-[#087f78] shrink-0" />
                          <h4 className="font-bold text-sm text-[#142238]">Explanation</h4>
                        </div>
                        <p className="text-sm text-[#3d5153] leading-6">{currentQuestion.explanation}</p>
                      </div>
                    )}

                    {!currentQuestion.explanation || currentQuestion.explanation.trim() === '' && (
                      <div className="mt-4 rounded-lg border border-[#e3e8e6] bg-[#f8fafc] p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle className="size-4 text-[#087f78] shrink-0" />
                          <h4 className="font-bold text-sm text-[#142238]">Explanation</h4>
                        </div>
                        <p className="text-sm text-[#6b7280]">No explanation available for this question.</p>
                      </div>
                    )}
                  </div>
                )}
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

              {/* Question-by-question summary */}
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-extrabold text-[#142238] uppercase tracking-wider">
                  Review your answers
                </h3>
                <div className="space-y-3">
                  {questions.map((q) => {
                    const userAnswer = answers[q.id]
                    const correctLetter = getCorrectLetter(q)
                    const isCorrect = userAnswer === correctLetter
                    const userOptionIndex = userAnswer ? userAnswer.charCodeAt(0) - 65 : -1
                    const correctOptionIndex = correctLetter ? correctLetter.charCodeAt(0) - 65 : -1
                    return (
                      <div
                        key={q.id}
                        className={`rounded-lg border p-4 ${isCorrect ? 'border-[#10b981] bg-[#dcfce7]/30' : 'border-[#ef4444] bg-[#fee2e2]/30'}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span
                            className={`font-bold text-xs ${isCorrect ? 'text-[#166534]' : 'text-[#991b1b]'}`}
                          >{isCorrect ? '✓' : '✗'}</span
                          >
                          <p className="text-sm font-semibold text-[#142238]">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`font-bold ${isCorrect ? 'text-[#166534]' : 'text-[#991b1b]'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          {!isCorrect && (
                            <>
                              <span className="text-[#6b7280] ml-2">Your answer:</span>
                              <span className="text-[#991b1b] ml-1">
                                {userAnswer ? `${String.fromCharCode(65 + userOptionIndex)}. ${q.options[userOptionIndex]}` : 'No answer'}
                              </span>
                              <span className="text-[#6b7280] ml-2">Correct:</span>
                              <span className="text-[#166534] ml-1">
                                {`${correctLetter}. ${q.options[correctOptionIndex]}`}
                              </span>
                            </>
                          )}
                        </div>
                        {q.explanation && q.explanation.trim() !== '' && (
                          <div className="mt-3 rounded-lg border border-[#e3e8e6] bg-[#f8fafc] p-3">
                            <div className="flex items-start gap-2 mb-1">
                              <AlertTriangle className="size-4 text-[#087f78] shrink-0" />
                              <h4 className="font-bold text-xs text-[#142238]">Explanation</h4>
                            </div>
                            <p className="text-xs text-[#3d5153] leading-5">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
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
