import { NextResponse } from 'next/server'
import { getPaymentById } from '@/lib/payments'
import { getAdminUser } from '@/lib/session'
import { downloadTelegramFile, TelegramError } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const { id } = await params
  const payment = await getPaymentById(id)
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
  }
  if (!payment.telegramFileId) {
    return NextResponse.json({ error: 'This payment has no Telegram screenshot reference.' }, { status: 404 })
  }

  try {
    const file = await downloadTelegramFile(payment.telegramFileId)
    const extension = file.contentType === 'image/png' ? 'png' : file.contentType === 'image/webp' ? 'webp' : 'jpg'
    return new Response(file.bytes, {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Length': String(file.bytes.byteLength),
        'Content-Disposition': `inline; filename="payment-proof.${extension}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error(`Could not load Telegram screenshot for payment ${payment.id}:`, error instanceof TelegramError ? error.message : error)
    return NextResponse.json({ error: 'The Telegram screenshot could not be loaded.' }, { status: 502 })
  }
}
