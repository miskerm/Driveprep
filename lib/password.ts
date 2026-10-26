import 'server-only'

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'

function scrypt(password: string, salt: Buffer, keyLength: number, options: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

// scrypt parameters. N must be a power of two; 2^15 keeps logins responsive
// while making offline brute-force attacks expensive.
const SCRYPT_N = 32768
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 64
const SALT_BYTES = 16

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`
  }
  if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  return null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 128 * 1024 * 1024,
  })

  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$')
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false

    const n = Number(parts[1])
    const r = Number(parts[2])
    const p = Number(parts[3])
    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false

    const salt = Buffer.from(parts[4], 'base64url')
    const expected = Buffer.from(parts[5], 'base64url')
    if (salt.length === 0 || expected.length === 0) return false

    const derived = await scrypt(password, salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: 128 * 1024 * 1024,
    })

    return derived.length === expected.length && timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}
