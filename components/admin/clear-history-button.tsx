'use client'

import { clearAccountHistoryAction } from '@/app/admin/users/actions'

export function ClearHistoryButton() {
  return (
    <form
      action={clearAccountHistoryAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            'Clear all account & payment status history?\n\nThis permanently deletes every status change record. This cannot be undone.',
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="text-xs font-bold text-[#b33636] underline underline-offset-4 hover:text-[#c24834]"
      >
        Clear all history
      </button>
    </form>
  )
}
