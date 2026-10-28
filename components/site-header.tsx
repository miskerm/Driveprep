'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart3,
  House,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '@/components/providers'

export function SiteHeader() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isHome = pathname === '/'
  const isDashboard = pathname.startsWith('/dashboard')

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <>
      <header className={`sticky top-0 z-20 border-b backdrop-blur ${isDashboard ? 'border-[#b9d8d3] bg-[#e7f6f2]/95' : 'border-[#dce6e4] bg-[#f8faf8]/95'}`}>
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-left">
            <div className="grid size-10 place-items-center rounded-full bg-[#e1f2ef] text-[#066f70]">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="text-[16px] font-extrabold">DrivoPrep</div>
              <div className="text-xs text-[#677775]">Get ready for your learners licence</div>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/" className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${isHome ? 'bg-[#007b78] text-white shadow-sm' : 'border border-[#bfcecb] bg-white text-[#314957]'}`}>
              <House className="size-4" />
              DrivoPrep Learners
            </Link>
            <Link href="/dashboard" className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${isDashboard ? 'bg-[#007b78] text-white shadow-sm' : 'border border-[#bfcecb] bg-white text-[#314957]'}`}>
              <BarChart3 className="size-4" />
              Dashboard
            </Link>
            <Link href="/pricing" className="rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm">
              Pricing
            </Link>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin/users" className="rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold">
                    Admin
                  </Link>
                )}
                {user.role !== 'admin' && user.paymentStatus !== 'approved' && (
                  <Link
                    href={user.paymentStatus === 'pending' ? '/payment/pending' : '/payment'}
                    className="rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold text-[#087f78]"
                  >
                    {user.paymentStatus === 'pending' ? 'Payment pending' : 'Payment'}
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm text-red-600">
                  <LogOut className="size-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded-lg border border-[#007b78] bg-white px-4 py-2.5 text-sm font-bold text-[#007b78]">
                Login
              </Link>
            )}
          </nav>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg border border-[#bfcecb] px-3 py-2 text-[#142238] hover:bg-[#effafa]"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile menu panel */}
      <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white transform translate-x-[-280px] transition-transform duration-300 lg:hidden lg:static lg:translate-x-0 lg:shadow-lg lg:border-r lg:border-[#d8e2e0]">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#dce6e4]">
          <span className="grid size-10 place-items-center rounded-full bg-[#e1f2ef] text-[#066f70]">
            <ShieldCheck className="size-6" />
          </span>
          <span>
            <span className="block text-base font-extrabold text-[#142238]">DrivoPrep</span>
            <span className="block text-xs font-bold uppercase tracking-widest text-[#168f82]">Learners</span>
          </span>
        </div>

        <nav className="mt-4 px-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isHome ? 'bg-[#007b78] text-white shadow-sm' : 'text-[#314957] hover:bg-[#effafa] hover:text-[#087f78]'}`}
          >
            <House className="size-4" />
            <span>DrivoPrep Learners</span>
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isDashboard ? 'bg-[#007b78] text-white shadow-sm' : 'text-[#314957] hover:bg-[#effafa] hover:text-[#087f78]'}`}
          >
            <BarChart3 className="size-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition hover:bg-[#effafa] hover:text-[#087f78]"
          >
            <span>Pricing</span>
          </Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition hover:bg-[#effafa] hover:text-[#087f78]"
                >
                  <span>Admin</span>
                </Link>
              )}
              {user.role !== 'admin' && user.paymentStatus !== 'approved' && (
                <Link
                  href={user.paymentStatus === 'pending' ? '/payment/pending' : '/payment'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold text-[#087f78] hover:bg-[#effafa]"
                >
                  <span>{user.paymentStatus === 'pending' ? 'Payment pending' : 'Payment'}</span>
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-red-600 hover:bg-[#fdeeee]"
              >
                <LogOut className="size-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold text-[#007b78] hover:bg-[#effafa]"
            >
              <span>Login</span>
            </Link>
          )}
        </nav>

        <div className="mt-4 p-4 text-xs text-[#718181]">
          Learner-licence study app built with Next.js 16, Auth.js, and Turso/libSQL.
        </div>
      </div>
    </>
  )
}
