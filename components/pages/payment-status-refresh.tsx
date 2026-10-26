'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'

export function PaymentStatusRefresh() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const timer = window.setInterval(() => {
      startTransition(() => router.refresh())
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [router])

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold text-[#087f78] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {pending ? 'Checking…' : 'Check status again'}
    </button>
  )
}
