import { NextResponse } from 'next/server'
import { getPracticeTopics } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const topics = await getPracticeTopics()
    return NextResponse.json(topics)
  } catch (error) {
    console.error('Failed to load practice topics:', error)
    return NextResponse.json({ error: 'Could not load practice topics' }, { status: 500 })
  }
}
