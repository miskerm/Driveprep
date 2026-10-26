'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { loginAction } from '@/app/(site)/login/actions'
import type { AuthFormState } from '@/lib/form-types'

const initialState: AuthFormState = {}

export function LoginPage({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <main className="mx-auto min-h-screen max-w-[1280px] px-5 py-16">
      <Link href="/" className="mb-10 inline-block rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 font-semibold text-[#087f78]">
        Back to home
      </Link>
      <section className="max-w-2xl rounded-2xl border border-[#d8e2e0] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-[#168f82]">DrivoPrep</p>
        <h1 className="mt-3 text-4xl font-extrabold">Welcome back</h1>
        <p className="mt-4 text-lg leading-8 text-[#607477]">
          Sign in with the email address or phone number you registered with.
        </p>

        <form action={formAction} className="mt-7 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div>
            <label htmlFor="login-identifier" className="text-sm font-bold text-[#314957]">
              Email or phone number
            </label>
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              placeholder="you@example.com or +251..."
              className="mt-1.5 w-full rounded-lg border border-[#cbd9d7] px-4 py-3 outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-sm font-bold text-[#314957]">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              className="mt-1.5 w-full rounded-lg border border-[#cbd9d7] px-4 py-3 outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
          </div>

          {state.error && (
            <p role="alert" className="rounded-lg bg-[#fdeeee] p-3 text-sm font-semibold text-[#b33636]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#087f78] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            {pending ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 border-t border-[#edf0ef] pt-5 text-sm text-[#607477]">
          <p>
            New to DrivoPrep?{' '}
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-bold text-[#087f78] underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#718181]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#168f82]" />
            Study, Practice, Mock Tests and Quick Quizzes unlock after your manual payment is verified by an administrator.
          </p>
        </div>
      </section>
    </main>
  )
}
