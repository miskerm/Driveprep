'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { setAccountStatusAction } from '@/app/admin/users/actions'

function SubmitButton({ terminated }: { terminated: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        terminated
          ? 'border-[#bfe5da] bg-[#e6f5f3] text-[#06625e] hover:bg-[#d9f0ed]'
          : 'border-[#e7c9c9] bg-white text-[#b33636] hover:bg-[#fdeeee]'
      }`}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : terminated ? (
        <ShieldCheck className="size-3.5" />
      ) : (
        <ShieldOff className="size-3.5" />
      )}
      {pending ? 'Updating…' : terminated ? 'Activate account' : 'Terminate account'}
    </button>
  )
}

export function AccountStatusButton({
  userId,
  name,
  status,
}: {
  userId: number
  name: string
  status: 'active' | 'terminated'
}) {
  const terminated = status === 'terminated'

  return (
    <form
      action={setAccountStatusAction}
      onSubmit={(event) => {
        if (terminated) return
        if (
          !window.confirm(
            `Terminate the account for ${name}?\n\nThey will lose premium content immediately, even if they are already signed in.`,
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={terminated ? 'active' : 'terminated'} />
      <SubmitButton terminated={terminated} />
    </form>
  )
}
