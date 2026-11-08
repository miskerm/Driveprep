'use client'

import Link from 'next/link'
import { Mail, Phone, ShieldCheck } from 'lucide-react'
import { FaFacebook } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaTelegram } from "react-icons/fa";

export function ContactPage() {
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
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Get in touch</h2>
          <p className="mt-4 text-lg text-[#607477] max-w-2xl mx-auto">
            Have questions about our driving theory courses? Reach out to us using any of the methods below.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Phone */}
          <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="size-6 text-[#087f78]" />
              <h3 className="text-lg font-extrabold">Phone</h3>
            </div>
            <p className="text-lg font-semibold text-[#142238] mb-2">+251 905 991 745</p>
            <p className="text-sm text-[#607477]">
              Call us during business hours (8:00 AM – 5:00 PM EAT).
            </p>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="size-6 text-[#087f78]" />
              <h3 className="text-lg font-extrabold">Email</h3>
            </div>
            <p className="text-lg font-semibold text-[#142238] mb-1">mgwfalconengineering2022@gmail.com</p>
            <p className="text-sm text-[#607477]">
              We typically respond within 24 hours.
            </p>
          </div>

          {/* Account info */}
          <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="size-6 text-[#087f78]" />
              <h3 className="text-lg font-extrabold">Account info</h3>
            </div>
            <p className="text-lg font-semibold text-[#142238] mb-1">Achenef Tarekegn</p>
            <p className="text-lg font-semibold text-[#142238] mb-2">CBE : 1000288873357</p>
            <p className="text-lg font-semibold text-[#142238] mb-2">Tele-Birr: +251905991745</p>
            <p className="text-sm text-[#607477]">
              Upgrade your account to unlock all study materials, practice questions, and mock tests.
            </p>
          </div>
        </div>

        {/* Social links */}
        <div className="mt-12 lg:mt-16 rounded-xl border border-[#d8e2e0] bg-[#f8fbfa] p-8 lg:p-12 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="text-xl font-extrabold text-[#142238]">Reach us</h3>
            <p className="mt-2 text-sm text-[#607477]">Stay connected with Selam Learner's.</p>
          </div>
          <div className="flex justify-center gap-4">
            <a href="https://www.facebook.com/share/1DwBtCjUMM/?mibextid=wwXIfr" className="rounded-lg border border-[#d8e2e0] bg-white p-3 text-[#087f78] hover:bg-[#087f78] hover:text-white transition-colors" aria-label="Facebook">
              <span className="text-xl"><FaFacebook/></span>
            </a>
            <a href="https://mgwfalconengineering@gmail.com" className="rounded-lg border border-[#d8e2e0] bg-white p-3 text-[#087f78] hover:bg-[#087f78] hover:text-white transition-colors" aria-label="Messenger">
              <span className="text-xl"><MdEmail/></span>
            </a>
            <a href="https://t.me/ATDA2026" className="rounded-lg border border-[#d8e2e0] bg-white p-3 text-[#087f78] hover:bg-[#087f78] hover:text-white transition-colors" aria-label="WhatsApp">
              <span className="text-xl"><FaTelegram /></span>
            </a>
          </div>
        </div>

        {/* Support note */}
        <div className="mt-12 rounded-xl border border-[#d5e7e3] bg-[#effafa] p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="size-6 text-[#087f78]" />
            <h3 className="text-lg font-extrabold text-[#142238]">Need premium access?</h3>
          </div>
          <p className="text-sm text-[#607477] mb-4">
            Visit our <Link href="/payment" className="text-[#087f78] font-semibold hover:underline">payment page</Link> to submit your bank or Telebirr receipt for verification.
          </p>
          <p className="text-sm text-[#607477]">
            Premium access unlocks all study materials, practice questions, and mock tests for one account.
          </p>
        </div>
      </div>
    </main>
  )
}
