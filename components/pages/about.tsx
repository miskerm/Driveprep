'use client'

import Link from 'next/link'
import { ShieldCheck, BookOpen, Trophy, Clock3 } from 'lucide-react'

export function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#142238]">
      <div className="border-b border-[#d8e2e0] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-4">
          <Link href="/" className="flex items-center gap-2 rounded-lg border border-[#bfcecb] px-4 py-2.5 font-semibold text-[#087f78]">
            Back to home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-7 py-16 lg:py-20">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">About DrivoPrep</h2>
          <p className="mt-4 text-lg text-[#607477] max-w-2xl mx-auto">
            Helping Ethiopian learners pass their driving theory test with confidence, one question at a time.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="size-6 text-[#087f78]" />
              <h3 className="text-lg font-extrabold">Our Mission</h3>
            </div>
            <p className="text-sm text-[#607477] leading-6">
              We believe every learner deserves access to clear, reliable study materials. DrivoPrep was built
              to make driver licence test preparation simple, affordable, and effective for everyone in Ethiopia.
            </p>
          </div>

          <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="size-6 text-[#087f78]" />
              <h3 className="text-lg font-extrabold">What We Offer</h3>
            </div>
            <ul className="space-y-3 text-sm text-[#607477]">
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Study materials organised by category
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Practice questions with instant feedback
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Full mock tests with time limits
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Progress tracking and results
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock3 className="size-6 text-[#087f78]" />
              <h3 className="text-lg font-extrabold">Why Learners Choose Us</h3>
            </div>
            <ul className="space-y-3 text-sm text-[#607477]">
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Content built for Ethiopian learner tests
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Free practice questions available
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Premium mock tests with 50-minute time limits
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#087f78] font-bold">✓</span>
                Manual payment verification with receipt upload
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 rounded-xl border border-[#d5e7e3] bg-[#effafa] p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-extrabold text-[#142238] mb-3">Ready to start learning?</h3>
              <p className="text-sm text-[#607477] mb-4">
                Join hundreds of learners preparing for their driver licence test with DrivoPrep.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/study" className="flex-1 sm:flex-none rounded-lg bg-[#087f78] px-6 py-3 text-center font-bold text-white hover:bg-[#066a64] transition-colors">
                Start Studying
              </Link>
              <Link href="/practice" className="flex-1 sm:flex-none rounded-lg border border-[#087f78] px-6 py-3 text-center font-bold text-[#087f78] hover:bg-[#e6f5f3] transition-colors">
                Try Practice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
