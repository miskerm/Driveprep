'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { ArrowLeft, ImageUp, Loader2, ShieldCheck, UploadCloud } from 'lucide-react'
import { submitPaymentAction } from '@/app/payment/actions'
import { PAYMENT_SCREENSHOT_MAX_BYTES, type PaymentSubmitState } from '@/lib/form-types'

const initialState: PaymentSubmitState = { status: 'idle', message: '' }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PaymentVerifyPage({
  amountLabel,
  userIdentifier,
  hideHeader = false,
}: {
  amountLabel: string
  userIdentifier: string
  hideHeader?: boolean
}) {
  const [state, formAction, pending] = useActionState(submitPaymentAction, initialState)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [fileError, setFileError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFileName('')
      setFileSize(0)
      setFileError('')
      return
    }

    setFileName(file.name)
    setFileSize(file.size)

    if (file.size > PAYMENT_SCREENSHOT_MAX_BYTES) {
      setFileError('The screenshot must be smaller than 5 MB.')
    } else if (file.type && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Only JPEG, PNG, or WebP images are accepted.')
    } else {
      setFileError('')
    }
  }

  return (
    <main className="min-h-screen bg-[#f6faf9] text-[#142238]">
      {!hideHeader && (
        <div className="border-b border-[#dbe5e4] bg-white">
          <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-5 py-4">
            <Link href="/payment" className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 text-sm font-bold text-[#087f78]">
              <ArrowLeft className="size-4" />
              Back to payment details
            </Link>
            <span className="hidden items-center gap-2 text-sm font-bold text-[#607477] sm:flex">
              <ShieldCheck className="size-5 text-[#168f82]" />
              Verified by an administrator
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[900px] px-5 py-10 lg:py-14">
        <section className="rounded-2xl border border-[#d8e2e0] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#168f82]">Payment verification</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Upload your payment screenshot</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#607477]">
            Upload a clear screenshot showing the amount, date, and recipient. It will be sent directly to the
            DrivoPrep Telegram bot for review. The image is not saved in our database.
          </p>

          <div className="mt-5 rounded-xl border border-[#f2dfac] bg-[#fffaf0] p-4 text-sm text-[#8a6410]">
            <p className="font-extrabold">Amount paid: {amountLabel}</p>
            <p className="mt-1">Account: {userIdentifier}</p>
          </div>

          <form action={formAction} className="mt-7 space-y-5">
            <div>
              <label htmlFor="payment-screenshot" className="block text-sm font-bold text-[#314957]">
                Payment screenshot
              </label>
              <label
                htmlFor="payment-screenshot"
                className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#bfcecb] bg-[#f8fbfa] px-6 py-10 text-center transition hover:border-[#087f78] hover:bg-[#f0faf8]"
              >
                <span className="grid size-12 place-items-center rounded-full bg-[#e6f5f3] text-[#087f78]">
                  <ImageUp className="size-6" />
                </span>
                <span className="text-sm font-extrabold text-[#142238]">
                  {fileName ? fileName : 'Choose a screenshot to upload'}
                </span>
                <span className="text-xs font-semibold text-[#718181]">
                  JPEG, PNG, or WebP · up to {formatBytes(PAYMENT_SCREENSHOT_MAX_BYTES)}
                </span>
                {fileSize > 0 && (
                  <span className="text-xs font-bold text-[#087f78]">{formatBytes(fileSize)} selected</span>
                )}
              </label>
              <input
                ref={inputRef}
                id="payment-screenshot"
                name="screenshot"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={onFileChange}
                className="sr-only"
              />
              {fileError && <p className="mt-2 text-xs font-bold text-[#b33636]">{fileError}</p>}
            </div>

            {state.status === 'error' && state.message && (
              <p role="alert" className="rounded-lg bg-[#fdeeee] p-3 text-sm font-semibold text-[#b33636]">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || Boolean(fileError)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#087f78] px-5 py-3.5 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
              {pending ? 'Sending to Telegram…' : 'Submit payment proof'}
            </button>

            <p className="text-xs leading-5 text-[#718181]">
              Submitting this form does not activate premium access. Your payment status stays pending until an
              administrator reviews the screenshot.
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}
