'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { signupAction } from '@/app/(site)/signup/actions'
import type { AuthFormState } from '@/lib/form-types'

const initialState: AuthFormState = {}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-semibold text-[#b33636]">{message}</p>
}

export function SignupPage({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(signupAction, initialState)

  return (
    <main className="mx-auto min-h-screen max-w-[1280px] px-5 py-16">
      <Link href="/" className="mb-10 inline-block rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 font-semibold text-[#087f78]">
        Back to home
      </Link>
      <section className="max-w-2xl rounded-2xl border border-[#d8e2e0] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-[#168f82]">DrivoPrep</p>
        <h1 className="mt-3 text-4xl font-extrabold">Create your account</h1>
        <p className="mt-4 text-lg leading-8 text-[#607477]">
          Register with your full name, an email address or phone number, and a password. You will be taken to the
          payment instructions next.
        </p>

        <form action={formAction} className="mt-7 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div>
            <label htmlFor="signup-name" className="text-sm font-bold text-[#314957]">
              Full name
            </label>
            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={120}
              placeholder="e.g. Lerato Mokoena"
              className="mt-1.5 w-full rounded-lg border border-[#cbd9d7] px-4 py-3 outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
            <FieldError message={state.fieldErrors?.name} />
          </div>
          <div>
            <label htmlFor="signup-identifier" className="text-sm font-bold text-[#314957]">
              Email or phone number
            </label>
            <input
              id="signup-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              placeholder="you@example.com or +251..."
              className="mt-1.5 w-full rounded-lg border border-[#cbd9d7] px-4 py-3 outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
            <p className="mt-1.5 text-xs text-[#718181]">
              Use whichever you want to sign in with. Phone numbers may include +, spaces, or dashes.
            </p>
            <FieldError message={state.fieldErrors?.identifier} />
          </div>
          <div>
            <label htmlFor="signup-password" className="text-sm font-bold text-[#314957]">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="At least 8 characters, with a letter and a number"
              className="mt-1.5 w-full rounded-lg border border-[#cbd9d7] px-4 py-3 outline-none focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20"
            />
            <FieldError message={state.fieldErrors?.password} />
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
            {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 border-t border-[#edf0ef] pt-5 text-sm text-[#607477]">
          Already registered?{' '}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-bold text-[#087f78] underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}
