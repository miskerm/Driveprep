import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/lib/session'
import { getStudyCategories } from '@/lib/db'
import { CategoryManager } from '@/components/admin/category-manager'

export const dynamic = 'force-dynamic'

export default async function AdminModulesPage() {
  await requireAdmin()
  const categories = await getStudyCategories()

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#168f82]">Study content</p>
          <h1 className="mt-1 text-3xl font-extrabold">Study Categories</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#607477]">
            Organise modules into categories. Each category can hold multiple PDF modules and a practice
            questionnaire. Learners see categories on the Study page.
          </p>
        </div>
        <Link href="/study" className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold text-[#087f78]">
          <ExternalLink className="size-4" />
          View Study page
        </Link>
      </header>

      <CategoryManager categories={categories} />
    </main>
  )
}
