import 'server-only'

export type TelegramPhotoResult = {
  messageId: number
  fileId: string | null
  fileUniqueId: string | null
}

function sniffContentType(bytes: Uint8Array) {
  if (bytes.length < 12) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF' &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

export class TelegramError extends Error {
  code: number | null

  constructor(message: string, code: number | null = null) {
    super(message)
    this.name = 'TelegramError'
    this.code = code
  }
}

function config() {
  const token = (process.env.TELEGRAM_BOT_TOKEN ?? '').trim()
  const chatId = (process.env.TELEGRAM_CHAT_ID ?? '').trim()
  if (!token || !chatId) {
    throw new TelegramError('Telegram credentials are not configured on the server.')
  }
  return { token, chatId }
}

export function isTelegramConfigured() {
  return Boolean(
    (process.env.TELEGRAM_BOT_TOKEN ?? '').trim() && (process.env.TELEGRAM_CHAT_ID ?? '').trim(),
  )
}

async function telegramResponse(response: Response) {
  let payload: {
    ok?: boolean
    result?: unknown
    description?: string
    error_code?: number
  }

  try {
    payload = (await response.json()) as typeof payload
  } catch {
    throw new TelegramError('Telegram returned an unreadable response.', response.status)
  }

  if (!response.ok || payload.ok !== true) {
    throw new TelegramError(
      payload.description || `Telegram request failed with status ${response.status}.`,
      payload.error_code ?? response.status,
    )
  }

  return payload.result
}

/**
 * Sends the screenshot to the configured Telegram chat and returns only the
 * metadata needed to identify it later. The image bytes are never persisted.
 */
export async function sendPaymentScreenshot(input: {
  bytes: Uint8Array
  fileName: string
  mimeType: string
  caption: string
}): Promise<TelegramPhotoResult> {
  const { token, chatId } = config()

  const form = new FormData()
  form.append('chat_id', chatId)
  form.append('caption', input.caption.slice(0, 1024))
  // Send the receipt as a document so Telegram does not recompress the
  // screenshot. Admins need to read small amounts, dates, and references.
  form.append(
    'document',
    new Blob([input.bytes], { type: input.mimeType }),
    input.fileName.replace(/[^\w.\-]/g, '_').slice(0, 120) || 'payment-proof.jpg',
  )

  let response: Response
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
  } catch (error) {
    throw new TelegramError(
      error instanceof Error && error.name === 'TimeoutError'
        ? 'Telegram did not respond in time.'
        : 'Telegram could not be reached.',
    )
  }

  const result = (await telegramResponse(response)) as {
    message_id?: number
    document?: { file_id?: string; file_unique_id?: string }
  }

  const messageId = Number(result?.message_id)
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw new TelegramError('Telegram did not return a message id.')
  }

  return {
    messageId,
    fileId: result?.document?.file_id ? String(result.document.file_id) : null,
    fileUniqueId: result?.document?.file_unique_id ? String(result.document.file_unique_id) : null,
  }
}

export async function downloadTelegramFile(fileId: string): Promise<{
  bytes: Uint8Array
  contentType: string
}> {
  const { token } = config()

  const infoResponse = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
    { signal: AbortSignal.timeout(15_000), cache: 'no-store' },
  )
  const info = (await telegramResponse(infoResponse)) as { file_path?: string }
  const filePath = String(info?.file_path ?? '')
  if (!filePath || filePath.includes('..')) {
    throw new TelegramError('Telegram did not return a usable file path.')
  }

  const fileResponse = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, {
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  })
  if (!fileResponse.ok) {
    throw new TelegramError(`Telegram file download failed with status ${fileResponse.status}.`)
  }

  const bytes = new Uint8Array(await fileResponse.arrayBuffer())
  const headerType = (fileResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const contentType =
    headerType && headerType !== 'application/octet-stream'
      ? headerType
      : sniffContentType(bytes) || 'application/octet-stream'

  return { bytes, contentType }
}

export function detectImageMime(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length < 12) return null
  return sniffContentType(bytes)
}
