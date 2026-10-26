'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/session'
import { getPaymentConfig } from '@/lib/payment-config'
import { getLatestPaymentForUser, createPaymentRecord, DuplicatePaymentError } from '@/lib/payments'
import { detectImageMime, isTelegramConfigured, sendPaymentScreenshot, TelegramError } from '@/lib/telegram'
import { getRequestIp, rateLimit } from '@/lib/rate-limit'
import {
  PAYMENT_SCREENSHOT_MAX_BYTES,
  PAYMENT_SCREENSHOT_TYPES,
  type PaymentSubmitState,
  type PaymentScreenshotType,
} from '@/lib/form-types'
import { accountKey } from '@/lib/users'

function error(message: string): PaymentSubmitState {
  return { status: 'error', message }
}

function isAllowedMime(value: string): value is PaymentScreenshotType {
  return (PAYMENT_SCREENSHOT_TYPES as readonly string[]).includes(value)
}

export async function submitPaymentAction(
  _previousState: PaymentSubmitState,
  formData: FormData,
): Promise<PaymentSubmitState> {
  const user = await requireUser('/payment/verify')

  if (user.status === 'terminated') redirect('/account/terminated')
  if (user.paymentStatus === 'approved') redirect('/dashboard')
  if (user.paymentStatus === 'pending') redirect('/payment/pending')

  const config = getPaymentConfig()
  if (!config.configured) {
    return error('Payment instructions are not configured yet. Please contact support.')
  }
  if (!isTelegramConfigured()) {
    return error('Payment uploads are temporarily unavailable. Please try again later.')
  }

  const ip = await getRequestIp()
  const ipLimit = rateLimit(`payment-ip:${ip}`, 12, 60 * 60 * 1000)
  if (!ipLimit.ok) {
    return error(`Too many payment attempts. Try again in ${ipLimit.retryAfterSeconds} seconds.`)
  }

  const userLimit = rateLimit(`payment-user:${user.id}`, 5, 60 * 60 * 1000)
  if (!userLimit.ok) {
    return error(`Too many payment attempts. Try again in ${userLimit.retryAfterSeconds} seconds.`)
  }

  const latest = await getLatestPaymentForUser(user.id)
  if (latest?.status === 'pending') {
    return error('You already have a payment waiting for admin verification.')
  }
  if (latest?.status === 'approved') {
    return error('Your payment is already approved. Refresh the dashboard to continue.')
  }

  const file = formData.get('screenshot')
  if (!(file instanceof File) || file.size === 0) {
    return error('Choose a screenshot of your payment before submitting.')
  }
  if (file.size > PAYMENT_SCREENSHOT_MAX_BYTES) {
    return error('The screenshot must be smaller than 5 MB.')
  }

  const declaredType = (file.type || '').toLowerCase()
  if (declaredType && !isAllowedMime(declaredType)) {
    return error('Only JPEG, PNG, or WebP images are accepted.')
  }

  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(await file.arrayBuffer())
  } catch {
    return error('The screenshot could not be read. Please choose the file again.')
  }

  const detectedType = detectImageMime(bytes)
  if (!detectedType) {
    return error('That file is not a valid JPEG, PNG, or WebP image.')
  }
  if (declaredType && declaredType !== detectedType) {
    return error('The image type does not match the selected file. Please choose the screenshot again.')
  }

  const reference = `DP-${user.id}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const identifier = accountKey(user)
  const caption = [
    'DrivoPrep payment proof',
    `Name: ${user.name}`,
    `Account: ${identifier}`,
    `Reference: ${reference}`,
    `Amount: ${config.amountLabel}`,
  ].join('\n')

  let telegram
  try {
    telegram = await sendPaymentScreenshot({
      bytes,
      fileName: file.name || 'payment-proof.jpg',
      mimeType: detectedType,
      caption,
    })
  } catch (uploadError) {
    console.error(
      `Telegram payment upload failed for user ${user.id}:`,
      uploadError instanceof TelegramError ? uploadError.message : uploadError,
    )
    return error('The screenshot could not be sent to Telegram. Please try again in a moment.')
  }

  try {
    await createPaymentRecord({
      user,
      amount: config.amount,
      reference,
      receiptName: (file.name || 'payment-proof').slice(0, 180),
      telegramMessageId: telegram.messageId,
      telegramFileId: telegram.fileId,
      telegramFileUniqueId: telegram.fileUniqueId,
    })
  } catch (recordError) {
    if (recordError instanceof DuplicatePaymentError) {
      return error(recordError.message)
    }
    console.error(`Could not save the payment submission for user ${user.id}:`, recordError)
    return error('Your screenshot was received, but the payment record could not be saved. Please contact support.')
  }

  revalidatePath('/payment')
  revalidatePath('/payment/pending')
  revalidatePath('/dashboard')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/users')

  redirect('/payment/pending')
}
