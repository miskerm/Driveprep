'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  House,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '@/components/providers'
import Image from "next/image";

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
          <Link href="/" className="flex items-center gap-2.5 text-left shrink-0">
            <div className="grid size-10 place-items-center ">
              <Image src="/selamlogo1.png"   alt="Selam Menged Logo" width={64} height={64}/>
            </div>
            <div>
              <div className="text-[16px] font-extrabold">Selam Learner's</div>
              <div className="text-xs text-[#677775]">Get ready for your Drivers licence</div>
            </div>
          </Link>

          {/* Desktop navigation - centered */}
          <nav className="hidden md:flex flex-1 justify-center items-center gap-6">
            <Link href="/" className={`text-sm font-semibold transition ${isHome ? 'text-[#007b78]' : 'text-[#314957] hover:text-[#087f78]'}`}>
              Home
            </Link>
            <Link href="/about" className="text-sm font-semibold transition text-[#314957] hover:text-[#087f78]">
              About us
            </Link>
            <Link href="/dashboard" className={`text-sm font-semibold transition ${isDashboard ? 'text-[#007b78]' : 'text-[#314957] hover:text-[#087f78]'}`}>
              Course &amp; module
            </Link>
            <Link href="/pricing" className="text-sm font-semibold transition text-[#314957] hover:text-[#087f78]">
              Pricing
            </Link>
            <Link href="/contact" className="text-sm font-semibold transition text-[#314957] hover:text-[#087f78]">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            {user ? (
              <>
                <Link
                  href={user.role === 'admin' ? '/admin/users' : '/dashboard'}
                  className="rounded-lg bg-[#007b78] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066a64] transition-colors"
                >
                  {user.role === 'admin' ? 'Admin' : 'Dashboard'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-[#bfcecb] px-4 py-2 text-sm font-bold text-[#007b78] hover:bg-[#effafa] transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-[#087f78] hover:text-[#007b78]">Login</Link>
                <Link href="/signup" className="rounded-lg bg-[#007b78] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066a64] transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

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
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white transform transition-transform duration-300 lg:hidden lg:static lg:shadow-lg lg:border-r lg:border-[#d8e2e0] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-[280px]'}`}>
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
            className={`block text-sm font-semibold transition ${isHome ? 'text-[#007b78]' : 'text-[#314957] hover:text-[#087f78]'}`}
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold transition text-[#314957] hover:text-[#087f78]"
          >
            About us
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-sm font-semibold transition ${isDashboard ? 'text-[#007b78]' : 'text-[#314957] hover:text-[#087f78]'}`}
          >
            Course &amp; module
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold transition text-[#314957] hover:text-[#087f78]"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold transition text-[#314957] hover:text-[#087f78]"
          >
            Contact
          </Link>
          {user ? (
            <>
              <Link
                href={user.role === 'admin' ? '/admin/users' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg bg-[#007b78] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066a64] transition-colors mb-3"
              >
                {user.role === 'admin' ? 'Admin' : 'Dashboard'}
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="block rounded-lg border border-[#bfcecb] px-4 py-2 text-sm font-bold text-[#007b78] hover:bg-[#effafa] transition-colors mb-3"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-[#087f78] hover:text-[#007b78] mb-2"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg bg-[#007b78] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066a64] transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        <div className="mt-4 p-4 text-xs text-[#718181]">
          Drivers-licence study app .
        </div>
      </div>
    </>
  )
}
