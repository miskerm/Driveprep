export type IdentifierKind = 'email' | 'phone'

export type Identifier = {
  kind: IdentifierKind
  /** Normalised value persisted in the users table. */
  value: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

export function normalizePhone(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  // Accept +251..., 00251..., 0251..., and local formats with spaces,
  // dashes, dots, or brackets.
  let cleaned = raw.replace(/[\s().-]/g, '')
  if (cleaned.startsWith('00')) cleaned = `+${cleaned.slice(2)}`

  const hasPlus = cleaned.startsWith('+')
  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length < 7 || digits.length > 15) return ''
  return hasPlus ? `+${digits}` : digits
}

/**
 * Accepts an email address or a phone number and returns a normalised
 * identifier. This is the only place the app decides which one a user typed.
 */
export function normalizeIdentifier(value: unknown): Identifier | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  if (raw.includes('@')) {
    const email = normalizeEmail(raw)
    if (email.length > 190 || !EMAIL_PATTERN.test(email)) return null
    return { kind: 'email', value: email }
  }

  const phone = normalizePhone(raw)
  if (!phone) return null
  return { kind: 'phone', value: phone }
}

export function isValidEmail(value: string) {
  return value.length <= 190 && EMAIL_PATTERN.test(value)
}

export function displayIdentifier(email: string | null, phone: string | null) {
  return email || phone || '—'
}

export function identifierMatches(
  user: { email: string | null; phone: string | null },
  identifier: Identifier,
) {
  return identifier.kind === 'email' ? user.email === identifier.value : user.phone === identifier.value
}
