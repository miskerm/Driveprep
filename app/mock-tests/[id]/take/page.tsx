import { requirePremium } from '@/lib/session'
import { getMockTestById, getMockTestQuestions } from '@/lib/db'
import { redirect } from 'next/navigation'
import TakeTestClient from './TakeTestClient'

export const dynamic = 'force-dynamic'

export default async function MockTestTakePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePremium('/mock-tests')
  const { id } = await params

  const test = await getMockTestById(id)
  if (!test) redirect('/mock-tests')

  const questions = await getMockTestQuestions(id)
  if (questions.length === 0) redirect('/mock-tests')

  return <TakeTestClient test={test} questions={questions} />
}
