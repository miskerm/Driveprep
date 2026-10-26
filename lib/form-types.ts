export type AuthFormState = {
  error?: string
  fieldErrors?: Record<string, string>
  notice?: string
}

export type PaymentSubmitState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

/** Maximum size of a payment screenshot accepted by the server action. */
export const PAYMENT_SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024

/** Image formats accepted for payment screenshots. */
export const PAYMENT_SCREENSHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type PaymentScreenshotType = (typeof PAYMENT_SCREENSHOT_TYPES)[number]
