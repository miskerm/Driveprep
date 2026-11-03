import Link from 'next/link'
import { requireAdmin } from '@/lib/session'
import { getStudyCategories } from '@/lib/db'
import { deleteStudyQuestionnaire } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminQuestionnairesPage() {
  await requireAdmin()
  const categories = await getStudyCategories()

  const allQuestionnaires = categories.flatMap((category) =>
    category.questionnaires.map((q) => ({ ...q, categoryTitle: category.title })),
  )

  async function handleDelete(formData: FormData) {
    await requireAdmin()
    const id = String(formData.get('id') ?? '').trim()
    if (!id) return
    try {
      await deleteStudyQuestionnaire(id)
      revalidatePath('/admin/questionnaires')
    } catch (error) {
      console.error('Failed to delete questionnaire:', error)
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#168f82]">Study content</p>
          <h1 className="mt-1 text-3xl font-extrabold">Questionnaires</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#607477]">
            Manage numbered questionnaires across all study categories. Each questionnaire contains a set of
            multiple-choice questions learners can take.
          </p>
        </div>
        <Link href="/admin/modules" className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-4 py-2.5 text-sm font-bold text-[#087f78]">
          <Trash2 className="size-4" />
          Manage categories
        </Link>
      </header>

      {allQuestionnaires.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c5d8d4] bg-[#f8fbfa] p-10 text-center">
          <Trash2 className="mx-auto size-10 text-[#8aa5a1]" />
          <p className="mt-3 text-base font-bold text-[#314957]">No questionnaires yet</p>
          <p className="mt-1 text-sm text-[#607477]">Create your first questionnaire from a category card on the Manage categories page.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#d8e2e0] bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#edf0ef]">
                  <th className="pb-3 text-xs font-bold text-[#607477]">Category</th>
                  <th className="pb-3 text-xs font-bold text-[#607477]">Questionnaire</th>
                  <th className="pb-3 text-xs font-bold text-[#607477]">Questions</th>
                  <th className="pb-3 text-xs font-bold text-[#607477]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ef]">
                {allQuestionnaires.map((q) => (
                  <tr key={q.id} className="hover:bg-[#fbfdfc]">
                    <td className="py-4 text-sm text-[#314957]">{q.categoryTitle}</td>
                    <td className="py-4 text-sm font-semibold text-[#142238]">{q.title}</td>
                    <td className="py-4 text-sm text-[#607477]">
                      {q.questionCount} question{q.questionCount === 1 ? '' : 's'}
                    </td>
                    <td className="py-4">
                      <form
                        action={handleDelete}
                        onSubmit={(e) => {
                          if (!window.confirm(`Delete “${q.title}” questionnaire? This cannot be undone.`)) {
                            e.preventDefault()
                          }
                        }}
                        className="inline"
                      >
                        <input type="hidden" name="id" value={q.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-[#e7c9c9] px-3 py-1.5 text-xs font-bold text-[#b33636] hover:bg-[#fdeeee]"
                        >
                          <Trash2 className="size-3.5 mr-1.5" /> Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
