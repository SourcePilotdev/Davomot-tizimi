/**
 * Sana va vaqt yordamchilari.
 *
 * QOIDA: dars sanasi va boshlanish vaqti qurilmaning MAHALLIY vaqti bo'yicha oddiy satr
 * sifatida saqlanadi: "YYYY-MM-DD" va "HH:mm".
 *  - `toISOString()` ishlatilmaydi: u UTC qaytaradi va kechqurungi darslarda sanani
 *    bir kunga siljitib yuboradi.
 *  - Satrlar leksikografik tartibda xronologik tartibga mos keladi, shuning uchun
 *    IndexedDB indekslari (date, [group_id+date]) oraliq so'rovlarida to'g'ri ishlaydi.
 *  - Kun qo'shish/ayirish kalendar kuni bo'yicha bajariladi (soat bo'yicha emas),
 *    shuning uchun yozgi/qishki vaqtga o'tish (DST) natijani buzmaydi.
 * `created_at` / `updated_at` esa UTC millisekund (Date.now()) — ular faqat tartiblash uchun.
 */

const pad = (n: number): string => String(n).padStart(2, '0')

/** Qurilmaning mahalliy sanasi: "2026-11-14". */
export function toLocalDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Qurilmaning mahalliy vaqti: "09:30". */
export function toLocalTime(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "YYYY-MM-DD" formati va kalendarda haqiqatan mavjud sana ekanini tekshiradi (masalan, 2026-02-30 — yaroqsiz). */
export function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** "HH:mm" (00:00–23:59) formatini tekshiradi. */
export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

/** Sanaga kun qo'shadi (manfiy son — ayiradi): addDays("2026-03-01", -1) → "2026-02-28". */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return toLocalDate(new Date(year, month - 1, day + days))
}

/** Oyning birinchi kuni: "2026-11-17" → "2026-11-01". */
export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`
}
