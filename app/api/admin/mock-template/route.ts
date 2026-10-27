import * as XLSX from 'xlsx'
import { getAdminUser } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return new Response('Admin access required', { status: 403 })
  }

  const rows = [
    ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation'],
    [
      'What does a red triangular sign mean?',
      'Mandatory action',
      'Warning',
      'Information',
      '',
      'B',
      'Red triangles warn drivers about a hazard ahead.',
    ],
    [
      'What is the speed limit in a residential area?',
      '40 km/h',
      '60 km/h',
      '80 km/h',
      '',
      'B',
      'The general residential limit is 60 km/h.',
    ],
    [
      'When should you apply the parking brake?',
      'When parked',
      'When turning',
      'When overtaking',
      '',
      'A',
      'Apply the parking brake whenever the vehicle is parked.',
    ],
  ]

  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [
    { wch: 52 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 52 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Mock test')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="mock-test-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  })
}
