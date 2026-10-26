'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'
import { ensureSchema } from '@/lib/schema'
import { hashPassword, validatePassword } from '@/lib/password'
import { normalizeIdentifier } from '@/lib/identifiers'
import { createUser, getUserByIdentifier, isConfiguredAdminIdentifier } from '@/lib/users'
import { getRequestIp, rateLimit, safeCallbackUrl } from '@/lib/rate-limit'
import type { AuthFormState } from '@/lib/form-types'

function isUniqueViolation(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(message)
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get('name') ?? '').trim().replace(/\s+/g, ' ')
  const identifier = normalizeIdentifier(formData.get('identifier'))
  const password = String(formData.get('password') ?? '')
  const callbackUrl = safeCallbackUrl(formData.get('callbackUrl'), '/payment')

  const fieldErrors: Record<string, string> = {}
  if (name.length < 2) fieldErrors.name = 'Enter your full name.'
  if (name.length > 120) fieldErrors.name = 'Name must be 120 characters or fewer.'
  if (!identifier) fieldErrors.identifier = 'Enter a valid email address or phone number.'

  const passwordError = validatePassword(password)
  if (passwordError) fieldErrors.password = passwordError

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: 'Please correct the highlighted fields.' }
  }

  const ip = await getRequestIp()
  const ipLimit = rateLimit(`signup-ip:${ip}`, 10, 60 * 60 * 1000)
  if (!ipLimit.ok) {
    return { error: `Too many signup attempts. Try again in ${ipLimit.retryAfterSeconds} seconds.` }
  }

  const identifierLimit = rateLimit(`signup-id:${identifier!.value}`, 3, 60 * 60 * 1000)
  if (!identifierLimit.ok) {
    return { error: 'Too many signup attempts for this account. Please wait before trying again.' }
  }

  if (isConfiguredAdminIdentifier(identifier!)) {
    return { error: 'This account cannot be created through public signup.' }
  }

  await ensureSchema()

  const existing = await getUserByIdentifier(identifier!)
  if (existing) {
    return { error: 'An account with that email or phone number already exists. Log in instead.' }
  }

  try {
    await createUser({
      name,
      identifier: identifier!,
      passwordHash: await hashPassword(password),
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: 'An account with that email or phone number already exists. Log in instead.' }
    }
    console.error('Could not create account:', error)
    return { error: 'Your account could not be created right now. Please try again.' }
  }

  try {
    await signIn('credentials', {
      identifier: identifier!.value,
      password,
      redirectTo: callbackUrl,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Your account was created, but automatic sign in failed. Please log in.' }
    }
    throw error
  }

  return { error: 'Your account was created, but sign in could not be completed. Please log in.' }
}
