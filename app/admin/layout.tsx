import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin | DrivoPrep',
  description: 'Manage users, payments, study modules, practice questions, mock tests, and quizzes.',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-[#f6faf9] text-[#142238] lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
