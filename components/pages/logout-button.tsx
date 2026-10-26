'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { useAuth } from '@/components/providers'

export function LogoutButton({ className }: { className?: string }) {
  const { logout } = useAuth()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
      router.push('/')
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={className ?? 'inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-5 py-3 font-bold text-[#314957] disabled:cursor-not-allowed disabled:opacity-60'}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
