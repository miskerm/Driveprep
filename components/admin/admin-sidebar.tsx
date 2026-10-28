'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Menu,
  Pencil,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const items: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: '/admin/users', label: 'Users', description: 'Accounts & premium access', icon: Users },
  { href: '/admin/payments', label: 'Payments', description: 'Verify manual payments', icon: CreditCard },
  { href: '/admin/modules', label: 'Add Module', description: 'Publish study material', icon: BookOpen },
  { href: '/admin/practice', label: 'Add Practice', description: 'Build practice sets', icon: Pencil },
  { href: '/admin/mock-tests', label: 'Add Mock Test', description: 'Create mock exams', icon: ClipboardList },
  { href: '/admin/quizzes', label: 'Add Quizzes', description: 'Build quick quizzes', icon: Sparkles },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button (visible only on mobile) */}
      <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 border-b border-[#d8e2e0] bg-white z-20">
        <Link href="/admin/users" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#087f78] text-white">
            <ShieldCheck className="size-6" />
          </span>
          <span>
            <span className="block text-base font-extrabold text-[#142238]">DrivoPrep</span>
            <span className="block text-xs font-bold uppercase tracking-widest text-[#168f82]">Admin panel</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg border border-[#bfcecb] px-3 py-2 text-[#142238] hover:bg-[#effafa]"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white transform translate-x-[-280px] transition-transform duration-300 lg:hidden lg:static lg:translate-x-0 lg:shadow-lg lg:border-r lg:border-[#d8e2e0]">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#d8e2e0]">
          <span className="grid size-10 place-items-center rounded-xl bg-[#087f78] text-white">
            <ShieldCheck className="size-6" />
          </span>
          <span>
            <span className="block text-base font-extrabold text-[#142238]">DrivoPrep</span>
            <span className="block text-xs font-bold uppercase tracking-widest text-[#168f82]">Admin panel</span>
          </span>
        </div>

        <nav className="mt-4 px-4 space-y-1">
          {items.map(({ href, label, description, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${active ? 'bg-[#087f78] text-white shadow-sm' : 'text-[#314957] hover:bg-[#effafa] hover:text-[#087f78]'}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${active ? 'bg-white/15 text-white' : 'bg-[#effafa] text-[#087f78]'}`}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{label}</span>
                  <span className="hidden text-xs font-semibold ${active ? 'text-white/75' : 'text-[#718181]'}" >{description}</span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 p-4 border-t border-[#edf0ef]">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#314957] hover:bg-[#effafa]"
          >
            <LayoutDashboard className="size-4" />
            Learner dashboard
          </Link>
          <Link
            href="/"
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#314957] hover:bg-[#effafa]"
          >
            <ShieldCheck className="size-4" />
            Client site
          </Link>
        </div>
        <div className="mt-4 p-4 text-xs text-[#8aa5a1]">
          Course content is stored in Turso and published to the learner study page.
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[280px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r border-b border-[#d8e2e0] bg-white">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:px-6 lg:py-6">
          <Link href="/admin/users" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#087f78] text-white">
              <ShieldCheck className="size-6" />
            </span>
            <span>
              <span className="block text-base font-extrabold text-[#142238]">DrivoPrep</span>
              <span className="block text-xs font-bold uppercase tracking-widest text-[#168f82]">Admin panel</span>
            </span>
          </Link>
          <Link href="/" className="rounded-lg border border-[#bfcecb] px-3 py-1.5 text-xs font-bold text-[#087f78] lg:hidden">
            Client site
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:mt-2 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-4 lg:pb-0">
          {items.map(({ href, label, description, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 transition lg:w-full ${active ? 'bg-[#087f78] text-white shadow-sm' : 'text-[#314957] hover:bg-[#effafa] hover:text-[#087f78]'}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${active ? 'bg-white/15 text-white' : 'bg-[#effafa] text-[#087f78]'}`}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{label}</span>
                  <span className={`hidden text-xs font-semibold lg:block ${active ? 'text-white/75' : 'text-[#718181]'}`}>{description}</span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden border-t border-[#edf0ef] p-4 lg:mt-auto lg:block">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#314957] hover:bg-[#effafa]">
            <LayoutDashboard className="size-4" />
            Learner dashboard
          </Link>
          <Link href="/" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#314957] hover:bg-[#effafa]">
            <ShieldCheck className="size-4" />
            Client site
          </Link>
          <p className="mt-4 px-3 text-xs text-[#8aa5a1]">Course content is stored in Turso and published to the learner study page.</p>
        </div>
      </aside>
    </>
  )
}
