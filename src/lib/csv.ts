export type CsvCell = string | number | null | undefined

// Excel/Sheets bunday belgidan boshlangan matnni formula deb hisoblaydi (CSV injection)
const FORMULA_START = /^[=+\-@\t\r]/

function cell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * CSV matni. Ajratuvchi — nuqtali vergul (o'zbek/rus mintaqa sozlamali Excel shuni kutadi, aks holda hamma narsa
 * bitta ustunga tushib qoladi). UTF-8 BOM bilan: Excel o'zbekcha harflarni (oʻ, gʻ) to'g'ri o'qiydi.
 * Foydalanuvchi kiritgan matn formula sifatida ishlab ketmasligi uchun himoyalangan.
 */
export function toCsv(rows: CsvCell[][]): string {
  return '\uFEFF' + rows.map((row) => row.map(cell).join(';')).join('\r\n') + '\r\n'
}
