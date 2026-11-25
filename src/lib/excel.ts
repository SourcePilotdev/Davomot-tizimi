import type { AttendanceStatus, Language } from '@/db/types'

export interface ExcelAttendanceRow {
  date: string
  time: string
  group: string
  topic: string
  student: string
  status: AttendanceStatus
  lateMinutes: number
}

interface ExcelLabels {
  date: string
  time: string
  group: string
  topic: string
  student: string
  status: string
  lateMinutes: string
}

interface ExcelOptions {
  rows: ExcelAttendanceRow[]
  title: string
  generatedAt: string
  headers: ExcelLabels
  statuses: Record<AttendanceStatus, string>
  language: Language
}

const TEXT: Record<Language, {
  report: string
  generated: string
  total: string
  summary: string
  present: string
  absent: string
  late: string
  excused: string
  lateTotal: string
  empty: string
}> = {
  uz: {
    report: 'DAVOMAT HISOBOTI',
    generated: 'Hisobot tayyorlangan vaqt',
    total: 'Jami qaydlar',
    summary: 'DAVOMAT STATISTIKASI',
    present: 'Keldi',
    absent: 'Kelmadi',
    late: 'Kech keldi',
    excused: 'Sababli',
    lateTotal: 'Jami kechikish (daqiqa)',
    empty: 'Hozircha davomat qaydlari mavjud emas.',
  },
  ru: {
    report: 'ОТЧЁТ ПО ПОСЕЩАЕМОСТИ',
    generated: 'Дата и время отчёта',
    total: 'Всего записей',
    summary: 'СТАТИСТИКА ПОСЕЩАЕМОСТИ',
    present: 'Присутствовал',
    absent: 'Отсутствовал',
    late: 'Опоздал',
    excused: 'По уважительной причине',
    lateTotal: 'Всего опозданий (мин.)',
    empty: 'Записей посещаемости пока нет.',
  },
  tg: {
    report: 'ҲИСОБОТИ ҲОЗИРШАВӢ',
    generated: 'Сана ва вақти ҳисобот',
    total: 'Ҳамагӣ сабтҳо',
    summary: 'ОМАРИ ҲОЗИРШАВӢ',
    present: 'Ҳозир',
    absent: 'Ғоиб',
    late: 'Дер омад',
    excused: 'Бо сабаб',
    lateTotal: 'Ҳамагӣ деркунӣ (дақ.)',
    empty: 'Ҳоло сабти ҳозиршавӣ нест.',
  },
  en: {
    report: 'ATTENDANCE REPORT',
    generated: 'Report generated',
    total: 'Total records',
    summary: 'ATTENDANCE SUMMARY',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    lateTotal: 'Total late minutes',
    empty: 'There are no attendance records yet.',
  },
}

const STATUS_COLORS: Record<AttendanceStatus, { background: string; color: string }> = {
  present: { background: '#D9EAD3', color: '#274E13' },
  absent: { background: '#F4CCCC', color: '#990000' },
  late: { background: '#FCE5CD', color: '#783F04' },
  excused: { background: '#CFE2F3', color: '#0B5394' },
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cell(value: unknown, className = ''): string {
  return `<td class="${className}">${escapeHtml(value)}</td>`
}

/** Excel ochadigan, rangli va chop etishga tayyor HTML Workbook (.xls). */
export function buildAttendanceExcelHtml(options: ExcelOptions): string {
  const { rows, title, generatedAt, headers, statuses, language } = options
  const words = TEXT[language]
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  }

  for (const row of rows) counts[row.status] += 1

  const totalLateMinutes = rows.reduce(
    (sum, row) => sum + (row.status === 'late' ? row.lateMinutes || 0 : 0),
    0,
  )

  const bodyRows = rows.length
    ? rows.map((row, index) => {
        const color = STATUS_COLORS[row.status]
        return `<tr>
          ${cell(index + 1, 'center number')}
          ${cell(row.date, 'date')}
          ${cell(row.time, 'center')}
          ${cell(row.group)}
          ${cell(row.topic)}
          ${cell(row.student)}
          <td class="status" style="background-color:${color.background};color:${color.color};font-weight:bold;text-align:center">${escapeHtml(statuses[row.status])}</td>
          ${cell(row.lateMinutes > 0 ? row.lateMinutes : '', 'center number')}
        </tr>`
      }).join('')
    : `<tr><td colspan="8" class="empty">${escapeHtml(words.empty)}</td></tr>`

  const summaryItems: Array<[string, number, string]> = [
    [words.present, counts.present, '#D9EAD3'],
    [words.absent, counts.absent, '#F4CCCC'],
    [words.late, counts.late, '#FCE5CD'],
    [words.excused, counts.excused, '#CFE2F3'],
  ]

  const summary = summaryItems.map(([label, count, color]) =>
    `<td class="summary-cell" style="background-color:${color}">
      <div class="summary-label">${escapeHtml(label)}</div>
      <div class="summary-value">${count}</div>
    </td>`,
  ).join('')

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="ProgId" content="Excel.Sheet">
<meta name="Generator" content="Davomat boshqaruv tizimi">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook>
  <x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Davomat</x:Name>
    <x:WorksheetOptions>
      <x:PageSetup><x:Layout x:Orientation="Landscape"/></x:PageSetup>
      <x:FitToPage/><x:Print><x:FitWidth>1</x:FitWidth><x:FitHeight>0</x:FitHeight></x:Print>
      <x:DoNotDisplayGridlines/>
    </x:WorksheetOptions>
  </x:ExcelWorksheet></x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml><![endif]-->
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; color: #263445; }
  table { border-collapse: collapse; width: 100%; }
  .title { background: #26364A; color: #FFFFFF; font-size: 19pt; font-weight: bold; text-align: center; padding: 14px; }
  .subtitle { background: #EAF0F6; color: #26364A; font-size: 12pt; font-weight: bold; text-align: center; padding: 9px; }
  .meta { color: #5B6573; font-size: 10pt; padding: 8px 4px 14px; }
  th { background: #344B63; color: #FFFFFF; border: 1px solid #26364A; padding: 9px 7px; font-size: 10pt; text-align: center; }
  td { border: 1px solid #C7D0D9; padding: 7px; font-size: 10pt; vertical-align: middle; }
  tr:nth-child(even) td:not(.status) { background: #F4F7FA; }
  .center { text-align: center; }
  .number { mso-number-format: "0"; }
  .date { mso-number-format: "\\@"; text-align: center; }
  .section { background: #26364A; color: #FFFFFF; font-weight: bold; padding: 9px; text-align: left; }
  .summary-cell { border: 1px solid #C7D0D9; text-align: center; padding: 10px; width: 25%; }
  .summary-label { font-size: 10pt; font-weight: bold; }
  .summary-value { font-size: 18pt; font-weight: bold; padding-top: 5px; }
  .empty { text-align: center; color: #6B7280; padding: 22px; }
  .footer { color: #64748B; font-size: 9pt; padding-top: 12px; }
</style>
</head>
<body>
<table>
  <tr><td class="title" colspan="8">${escapeHtml(words.report)}</td></tr>
  <tr><td class="subtitle" colspan="8">${escapeHtml(title)}</td></tr>
  <tr><td class="meta" colspan="8">${escapeHtml(words.generated)}: ${escapeHtml(generatedAt)} &nbsp; | &nbsp; ${escapeHtml(words.total)}: ${rows.length}</td></tr>
  <tr>
    <th>№</th>
    <th>${escapeHtml(headers.date)}</th>
    <th>${escapeHtml(headers.time)}</th>
    <th>${escapeHtml(headers.group)}</th>
    <th>${escapeHtml(headers.topic)}</th>
    <th>${escapeHtml(headers.student)}</th>
    <th>${escapeHtml(headers.status)}</th>
    <th>${escapeHtml(headers.lateMinutes)}</th>
  </tr>
  ${bodyRows}
  <tr><td class="section" colspan="8">${escapeHtml(words.summary)}</td></tr>
  <tr>${summary}</tr>
  <tr><td colspan="8" class="footer">${escapeHtml(words.lateTotal)}: ${totalLateMinutes}</td></tr>
</table>
</body>
</html>`
}
