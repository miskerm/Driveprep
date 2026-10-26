'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'
import { normalizeIdentifier } from '@/lib/identifiers'
import { getRequestIp, rateLimit, safeCallbackUrl } from '@/lib/rate-limit'
import type { AuthFormState } from '@/lib/form-types'

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const identifier = normalizeIdentifier(formData.get('identifier'))
  const password = String(formData.get('password') ?? '')
  const callbackUrl = safeCallbackUrl(formData.get('callbackUrl'))

  if (!identifier || !password) {
    return { error: 'Enter your email or phone number and your password.' }
  }

  const ip = await getRequestIp()
  const ipLimit = rateLimit(`login-ip:${ip}`, 30, 10 * 60 * 1000)
  if (!ipLimit.ok) {
    return { error: `Too many login attempts. Try again in ${ipLimit.retryAfterSeconds} seconds.` }
  }

  try {
    await signIn('credentials', {
      identifier: identifier.value,
      password,
      redirectTo: callbackUrl,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'The email/phone number or password is incorrect.' }
    }
    throw error
  }

  return { error: 'Sign in could not be completed. Please try again.' }
}
