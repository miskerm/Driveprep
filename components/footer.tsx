'use client'

import Link from 'next/link'
import { ExternalLink, Mail, MessageCircle, Phone, Send } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-[#334155] bg-[#0f172a] py-10">
      <div className="mx-auto max-w-[1280px] px-5">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Logo, company name, description */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-10 place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/selamlogo1.png" alt="Selam Menged Logo" className="w-10 h-10" />
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-[#f8fafc]">Selam Learner's</div>
                <div className="text-xs text-[#94a3b8]">Drivers licence study app</div>
              </div>
            </div>
            <p className="text-sm text-[#94a3b8] leading-6">
              A Drivers Licence study app with practice-style questions, clear explanations, and a full mock test simulation.
            </p>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h3 className="text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="flex flex-col gap-2.5">
              <li><Link href="/" className="text-sm text-[#94a3b8] hover:text-[#087f78]">Home</Link></li>
              <li><Link href="/dashboard" className="text-sm text-[#94a3b8] hover:text-[#087f78]">Dashboard</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#94a3b8] hover:text-[#087f78]">Pricing</Link></li>
              <li><Link href="/signup" className="text-sm text-[#94a3b8] hover:text-[#087f78]">Sign Up</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">Contact</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3">
                <Phone className="size-5 shrink-0 text-[#087f78]" />
                <div>
                  <div className="text-sm text-[#94a3b8]">Phone</div>
                  <div className="text-sm font-semibold text-[#f8fafc]">+251 11 123 4567</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="size-5 shrink-0 text-[#087f78]" />
                <div>
                  <div className="text-sm text-[#94a3b8]">Mobile</div>
                  <div className="text-sm font-semibold text-[#f8fafc]">+251 91 123 4567</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="size-5 shrink-0 text-[#087f78]" />
                <div>
                  <div className="text-sm text-[#94a3b8]">Email</div>
                  <div className="text-sm font-semibold text-[#f8fafc]">info@selamlearners.com</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Social links */}
          <div>
            <h3 className="text-sm font-extrabold text-[#f8fafc] mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex gap-3">
              <a href="#" className="rounded-lg border border-[#334155] bg-[#1e293b] p-2.5 text-[#94a3b8] hover:bg-[#087f78] hover:text-white transition-colors" aria-label="Website">
                <ExternalLink className="size-5" />
              </a>
              <a href="#" className="rounded-lg border border-[#334155] bg-[#1e293b] p-2.5 text-[#94a3b8] hover:bg-[#087f78] hover:text-white transition-colors" aria-label="Messenger">
                <MessageCircle className="size-5" />
              </a>
              <a href="#" className="rounded-lg border border-[#334155] bg-[#1e293b] p-2.5 text-[#94a3b8] hover:bg-[#087f78] hover:text-white transition-colors" aria-label="WhatsApp">
                <Send className="size-5" />
              </a>
            </div>
            <p className="mt-5 text-xs text-[#64748b]">© 2026 Selam Learner's. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
