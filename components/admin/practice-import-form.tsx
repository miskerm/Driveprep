'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Upload, Download, AlertTriangle, ShieldCheck } from 'lucide-react'
import { importPracticeExcelAction, savePracticeExcelQuestionsAction } from '@/app/admin/practice/actions'
import type { PracticeExcelImportState, PracticeExcelSaveState } from '@/lib/mock-types'

export function PracticeImportForm() {
  const [importState, importAction, importing] = useActionState(
    importPracticeExcelAction,
    {
      status: 'idle',
      message: '',
      questions: [],
      warnings: [],
      suggestedTitle: '',
      fileName: '',
      topicId: '',
    } as PracticeExcelImportState,
  )
  const [saveState, saveAction, saving] = useActionState(
    savePracticeExcelQuestionsAction,
    { status: 'idle', message: '' } as PracticeExcelSaveState,
  )
  const [showSaveForm, setShowSaveForm] = useState(false)

  return (
    <section className="mt-5 rounded-lg border border-[#dbe8e6] bg-white p-4 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#142238]">Import questions from Excel</h3>
        <p className="mt-1 text-xs text-[#607477]">Upload an Excel workbook to add questions to a practice topic.</p>
      </div>

      {importState.status === 'success' && importState.questions.length > 0 ? (
        <>
          <div className="rounded-lg border border-[#dbe8e6] bg-[#f8fbfa] p-3 text-xs leading-5 text-[#3d5153]">
            <p className="font-bold text-[#142238]">Questions read from Excel</p>
            <p className="mt-1">
              {importState.questions.length} question{importState.questions.length === 1 ? '' : 's'} found in{' '}
              <code className="rounded bg-white px-1 py-0.5">{importState.fileName}</code>, in Excel order.
            </p>
          </div>

          <form action={saveAction} className="space-y-3">
            <input type="hidden" name="topicId" value={importState.topicId} />
            <input type="hidden" name="topicTitle" value={importState.topicTitle} />
            <input type="hidden" name="questions" value={JSON.stringify(importState.questions)} />
            <input type="hidden" name="fileName" value={importState.fileName} />

            <div>
              <label className="text-xs font-bold text-[#314957] block">Practice topic title</label>
              <input
                name="topicTitle"
                type="text"
                required
                defaultValue={
                  importState.suggestedTitle || importState.fileName.replace(/\.(xlsx|xls|csv)$/i, '')
                }
                placeholder="e.g. Road Signs"
                className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#314957] block">Description (optional)</label>
              <textarea
                name="topicDescription"
                rows={2}
                placeholder="What does this practice topic cover?"
                className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
              />
            </div>

            {saveState.status !== 'idle' && (
              <p
                role="status"
                className={`flex items-start gap-2 rounded-lg p-2 text-xs font-semibold ${
                  saveState.status === 'success'
                    ? 'bg-[#e6f5f3] text-[#06625e]'
                    : 'bg-[#fdeeee] text-[#b33636]'
                }`}
              >
                {saveState.status === 'success' && <ShieldCheck className="mt-0.5 size-4 shrink-0" />}
                {saveState.message}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#087f78] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save to topic'}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="mt-2 w-full rounded-lg border border-[#cbd9d7] px-4 py-2 text-sm font-bold text-[#607477]"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      ) : (
        <form action={importAction} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-[#314957] block">Topic ID (e.g. road-signs)</label>
              <input
                name="topicId"
                type="text"
                required
                placeholder="road-signs"
                className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-[#314957] block">Topic title</label>
              <input
                name="topicTitle"
                type="text"
                required
                placeholder="Road Signs"
                className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-[#314957] block">Excel file</label>
              <input
                name="practiceExcel"
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                required
                className="block w-full cursor-pointer rounded-lg border border-[#cbd9d7] bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#fff1ed] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[#c24834]"
              />
            </div>
            <button
              type="submit"
              disabled={importing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ef6a57] px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="size-4" />
              {importing ? 'Reading…' : 'Read Excel'}
            </button>
            <a
              href="/api/admin/mock-template"
              className="inline-flex items-center gap-2 rounded-lg border border-[#bfcecb] bg-white px-3 py-2 text-xs font-bold text-[#087f78]"
            >
              <Download className="size-4" />
              Download template
            </a>
          </div>
        </form>
      )}

      {importState.status === 'error' && importState.message && (
        <p role="status" className="flex items-start gap-2 rounded-lg p-2 text-xs font-semibold bg-[#fdeeee] text-[#b33636]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {importState.message}
        </p>
      )}

      {importState.warnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-[#f2dfac] bg-[#fffaf0] p-3 text-xs leading-5 text-[#8a6410]">
          <p className="flex items-center gap-2 font-bold">
            <AlertTriangle className="size-4" />
            Import notes
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {importState.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
