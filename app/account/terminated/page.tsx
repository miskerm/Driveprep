import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldAlert, ShieldOff } from 'lucide-react'
import { getCurrentUser } from '@/lib/session'
import { LogoutButton } from '@/components/pages/logout-button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account terminated | DrivoPrep',
  description: 'Your DrivoPrep account has been terminated.',
}

export default async function TerminatedAccountRoute() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?callbackUrl=%2Faccount%2Fterminated')
  if (user.status !== 'terminated') redirect('/dashboard')

  return (
    <main className="min-h-screen bg-[#f6faf9] px-5 py-16 text-[#142238]">
      <div className="mx-auto max-w-[680px]">
        <section className="rounded-2xl border border-[#f0c9c9] bg-white p-8 text-center shadow-sm sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#fdf1f1] text-[#b33636]">
            <ShieldAlert className="size-8" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#b33636]">Access blocked</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Your account has been terminated</h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#607477]">
            An administrator terminated the account for <strong>{user.name}</strong>
            {user.email || user.phone ? ` (${user.email || user.phone})` : ''}. Premium content is blocked
            immediately, even if you are still signed in.
          </p>

          <div className="mt-6 rounded-xl border border-[#e3e8e6] bg-[#f8fbfa] p-4 text-left text-sm leading-6 text-[#3d5153]">
            <p className="flex items-start gap-2 font-bold text-[#314957]">
              <ShieldOff className="mt-0.5 size-4 shrink-0 text-[#b33636]" />
              What you can do
            </p>
            <p className="mt-2">
              If you believe this was a mistake, contact DrivoPrep support with the account details above and your
              latest payment reference. Do not create another account to bypass the restriction.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <LogoutButton />
            <Link href="/" className="rounded-lg bg-[#087f78] px-5 py-3 font-bold text-white">
              Return to home
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
