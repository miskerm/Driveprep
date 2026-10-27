'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock2, RefreshCw, ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react'
import type { ParsedMockQuestion } from '@/lib/mock-types'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

type TakeTestClientProps = {
  test: {
    id: string
    title: string
    description: string | null
    questionCount: number
    timeLimitMin: number | null
    passMark: number
    createdAt: string
  }
  questions: ParsedMockQuestion[]
}

export default function TakeTestClient({
  test,
  questions,
}: TakeTestClientProps) {
  const [timeLeft, setTimeLeft] = useState((test.timeLimitMin ?? 60) * 60)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const total = questions.length

  useEffect(() => {
    if (submitted || showResults) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSubmitted(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [submitted, showResults])

  const timeExpired = timeLeft <= 0 && !submitted && !showResults

  const results = questions.map((q) => {
    const userAnswer = answers[q.position]
    const isCorrect = userAnswer === q.correct
    return { ...q, userAnswer, isCorrect }
  })
  const score = results.filter((r) => r.isCorrect).length
  const passed = (score / total) * 100 >= test.passMark

  const goToQuestion = useCallback((pos: number) => {
    if (pos < 1 || pos > total) return
    setCurrentQuestion(pos)
  }, [total])

  const selectAnswer = useCallback((option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: option }))
  }, [currentQuestion])

  const currentQuestionData = questions.find((q) => q.position === currentQuestion)
  const currentAnswer = answers[currentQuestion]

  const optionElements = currentQuestionData?.options.map((option, index) => {
    const letter = String.fromCharCode(65 + index)
    const isSelected = currentAnswer === option
    return (
      <label
        key={option}
        onClick={() => selectAnswer(option)}
        className={`block cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
          isSelected
            ? 'border-[#168f82] bg-[#e6f5f3]'
            : 'border-[#d8e2e0] bg-white'
        }`}
      >
        <input
          type="radio"
          name="answer"
          value={option}
          checked={isSelected}
          onChange={() => selectAnswer(option)}
          className="size-5 accent-[#168f82]"
          disabled={submitted}
        />
        <span className="font-semibold">{letter}. {option}</span>
      </label>
    )
  })

  const handleSubmit = () => {
    setSubmitted(true)
    if (timerRef.current) clearInterval(timerRef.current)
    setShowResults(true)
  }

  const handleRetake = () => {
    setAnswers({})
    setCurrentQuestion(1)
    setTimeLeft((test.timeLimitMin ?? 60) * 60)
    setSubmitted(false)
    setShowResults(false)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSubmitted(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  if (showResults) {
    return (
      <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
        <div className="border-b border-[#dbe5e4] bg-white">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-7 py-4">
            <div>
              <h1 className="text-2xl font-extrabold">{test.title} Results</h1>
              <p className="mt-1 text-sm font-semibold text-[#607477]">
                Your score: {score} / {total} ({Math.round((score / total) * 100)}%)
              </p>
            </div>
            <Link
              href="/mock-tests"
              className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]"
            >
              <ArrowLeft className="size-4" />
              Back to mock tests
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-7 py-12">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-xl border border-[#dfe7e6] bg-white p-3">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-[#168f82] mb-3">
                Review answers
              </h2>
              <div className="grid grid-cols-8 gap-2">
                {questions.map((q) => {
                  const r = results.find((x) => x.position === q.position)
                  return (
                    <button
                      key={q.position}
                      onClick={() => setCurrentQuestion(q.position)}
                      className={`rounded-md border px-1 py-1 text-xs font-bold transition ${
                        r?.isCorrect
                          ? 'border-[#23a36c] bg-[#e6f5f3] text-[#106c69]'
                          : 'border-[#ef6a57] bg-[#fdeeee] text-[#b33636]'
                      }`}
                    >
                      Q{q.position}
                    </button>
                  )
                })}
              </div>
            </aside>

            <div className="flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-[#168f82]" />
                  <div>
                    <h2 className="text-2xl font-extrabold">
                      {passed ? 'You passed!' : 'You did not pass.'}
                    </h2>
                    <p className="mt-1 text-sm text-[#607477]">
                      Score: {score} / {total} ({Math.round((score / total) * 100)}%) \u00b7
                      Pass mark: {test.passMark}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78] hover:bg-[#effafa]"
                >
                  <RefreshCw className="size-4" /> Retake
                </button>
              </div>

              <section className="rounded-xl border border-[#dfe7e6] bg-white">
                <div className="border-b border-[#dfe7e6] bg-[#f8fbfa] px-6 py-3">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#168f82]">
                    Question review
                  </h3>
                </div>
                <div className="divide-y divide-[#dfe7e6]">
                  {results.map((r) => (
                    <div key={r.position} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-full font-bold text-xs ${
                            r.isCorrect ? 'bg-[#e6f5f3] text-[#23a36c]' : 'bg-[#fdeeee] text-[#c24834]'
                          }`}
                        >
                          {r.isCorrect ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-6 text-[#142238]">
                            Q{r.position}. {r.question}
                          </p>
                          <p className="mt-1 text-xs text-[#607477]">
                            Your answer:{' '}
                            <span className={`font-bold ${r.userAnswer === r.correct ? 'text-[#23a36c]' : 'text-[#c24834]'}`}>
                              {r.userAnswer ?? 'Not answered'}
                            </span>
                            {r.isCorrect ? (
                              <span className="ml-2 text-xs text-[#23a36c]">Correct</span>
                            ) : (
                              <span className="ml-2 text-xs text-[#c24834]">Incorrect</span>
                            )}
                            {!r.isCorrect && (
                              <span className="ml-2 text-xs text-[#168f82]">Correct answer: {r.correct}</span>
                            )}
                          </p>
                          {r.explanation && (
                            <p className="mt-1 text-xs text-[#3d5153] bg-[#fbfdfc] rounded p-2">
                              Explanation: {r.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      <div className="border-b border-[#dbe5e4] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-7 py-4">
          <div>
            <h1 className="text-2xl font-extrabold">{test.title}</h1>
            <p className="mt-1 text-sm font-semibold text-[#607477]">
              {test.description || 'Timed mock test'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-4 font-bold text-sm">
            <div className="flex items-center gap-2">
              <Clock2 className="size-4 text-[#c24834]" />
              <span className={timeLeft <= 60 ? 'text-[#c24834] font-extrabold' : 'text-[#142238]'}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Link
              href="/mock-tests"
              className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-7 py-12">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border border-[#dfe7e6] bg-white p-3">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-[#168f82] mb-3">
              Questions ({total})
            </h2>
            <div className="grid grid-cols-8 gap-2">
              {questions.map((q) => {
                const answered = q.position in answers
                const isCorrect = answers[q.position] === q.correct
                return (
                  <button
                    key={q.position}
                    onClick={() => goToQuestion(q.position)}
                    disabled={submitted}
                    className={`rounded-md border px-1 py-1 text-xs font-bold transition ${
                      q.position === currentQuestion
                        ? 'border-[#e5bc45] bg-[#fff8da]'
                        : answered
                          ? isCorrect
                            ? 'border-[#23a36c] bg-[#e6f5f3] text-[#106c69]'
                            : 'border-[#ef6a57] bg-[#fdeeee] text-[#b33636]'
                          : 'border-[#dbe8e6] bg-white text-[#116c69]'
                    }`}
                  >
                    Q{q.position}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 rounded-lg bg-[#f3faf9] p-3 text-xs leading-5">
              <ShieldCheck className="mr-2 inline size-5 text-[#1fa39d]" />
              <b>Tip:</b> You can jump between questions anytime. Select one option per question.
            </div>
          </aside>

          <div className="flex flex-col">
            <div className="mb-4 flex justify-end gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitted}
                className="rounded-lg bg-[#cf2638] px-4 py-2.5 font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitted ? 'Submitted' : 'Submit Test'}
              </button>
              <Link href="/mock-tests" className="rounded-lg border border-[#8eb7b3] px-4 py-2.5 font-semibold text-[#176d6b]">
                Exit
              </Link>
            </div>

            <section className="rounded-xl border border-[#dfe7e6] bg-white p-7">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-[#e6f5f3] px-3 py-1 text-xs font-bold uppercase text-[#168f82]">
                  Question {currentQuestion} of {total}
                </span>
                <span className="ml-auto text-xs font-semibold uppercase text-[#168f82]">
                  {currentAnswer ? 'Answered' : 'Not answered'}
                </span>
              </div>

              {currentQuestionData && (
                <div>
                  <h2 className="mt-4 text-2xl font-extrabold leading-7">{currentQuestionData.question}</h2>
                  <div className="mt-8 space-y-3">{optionElements}</div>
                </div>
              )}

              {timeExpired && (
                <div className="mt-5 rounded-lg border border-[#ef6a57] bg-[#fdeeee] p-4 text-center">
                  <p className="font-bold text-[#c24834]">Time's up!</p>
                  <p className="mt-1 text-sm text-[#b33636]">Your test has been submitted automatically.</p>
                </div>
              )}
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={() => goToQuestion(currentQuestion - 1)}
                  disabled={currentQuestion <= 1 || submitted}
                  className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="size-4" /> Previous
                </button>
                <button
                  onClick={() => {
                    if (currentQuestion >= total) {
                      handleSubmit()
                    } else {
                      goToQuestion(currentQuestion + 1)
                    }
                  }}
                  disabled={submitted}
                  className="flex items-center gap-2 rounded-lg bg-[#087f78] px-4 py-2.5 font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {currentQuestion >= total ? (
                    <>
                      <CheckCircle2 className="size-4" /> Submit Test
                    </>
                  ) : (
                    <>
                      Next <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
