import 'server-only'

export type PaymentConfig = {
  amount: number
  amountLabel: string
  currency: string
  bankName: string
  accountName: string
  accountNumber: string
  referenceNote: string
  configured: boolean
}

function clean(value: string | undefined) {
  return (value ?? '').trim()
}

export function getPaymentConfig(): PaymentConfig {
  const currency = clean(process.env.PAYMENT_CURRENCY) || 'ETB'
  const rawAmount = Number(clean(process.env.PAYMENT_AMOUNT) || '0')
  const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 0
  const bankName = clean(process.env.PAYMENT_BANK_NAME)
  const accountName = clean(process.env.PAYMENT_ACCOUNT_NAME)
  const accountNumber = clean(process.env.PAYMENT_ACCOUNT_NUMBER)
  const referenceNote =
    clean(process.env.PAYMENT_REFERENCE_NOTE) ||
    'Use your full name and account email/phone as the payment reference.'

  return {
    amount,
    amountLabel: amount ? `${amount.toLocaleString('en-US')} ${currency}` : 'Not configured',
    currency,
    bankName,
    accountName,
    accountNumber,
    referenceNote,
    configured: amount > 0 && Boolean(bankName && accountName && accountNumber),
  }
}
