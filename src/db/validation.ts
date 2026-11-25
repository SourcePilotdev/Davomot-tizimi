import { isValidDate, isValidTime } from '@/lib/date'
import { ATTENDANCE_STATUSES, type AttendanceStatus } from './types'

/** "Kech keldi" uchun yuqori chegara (daqiqa): darsdan ancha uzoq kechikish — odatda xato kiritish. */
export const MAX_LATE_MINUTES = 600

/** Interfeys har bir kodni `errors.<kod>` tarjimasi orqali foydalanuvchiga ko'rsatadi. */
export type ValidationCode =
  | 'name_required'
  | 'group_not_found'
  | 'student_not_found'
  | 'lesson_not_found'
  | 'date_invalid'
  | 'time_invalid'
  | 'status_invalid'
  | 'late_minutes_invalid'

export class ValidationError extends Error {
  readonly code: ValidationCode

  constructor(code: ValidationCode) {
    super(code)
    this.name = 'ValidationError'
    this.code = code
  }
}

/** Bo'sh bo'lmagan matnni qaytaradi: chetlardagi bo'shliqlarni olib tashlaydi, ichkaridagilarini bittaga keltiradi. */
export function requireText(value: string, code: ValidationCode = 'name_required'): string {
  const text = value.trim().replace(/\s+/g, ' ')
  if (!text) throw new ValidationError(code)
  return text
}

/**
 * Telefon raqamini yagona ko'rinishga keltiradi: faqat raqamlar va boshidagi "+".
 * "+998 (90) 123-45-67" → "+998901234567". Bo'sh qiymat ruxsat etiladi.
 */
export function normalizePhone(raw: string | undefined): string {
  const cleaned = (raw ?? '').replace(/[^\d+]/g, '')
  return (cleaned.startsWith('+') ? '+' : '') + cleaned.replace(/\+/g, '')
}

export function requireDate(value: string): string {
  if (!isValidDate(value)) throw new ValidationError('date_invalid')
  return value
}

export function requireTime(value: string): string {
  if (!isValidTime(value)) throw new ValidationError('time_invalid')
  return value
}

/**
 * Davomat qoidalari: "kech keldi" uchun daqiqa majburiy (1…MAX_LATE_MINUTES),
 * boshqa holatlarda daqiqa har doim 0 ga tenglashtiriladi.
 */
export function normalizeAttendance(
  status: AttendanceStatus,
  lateMinutes?: number,
): { status: AttendanceStatus; late_minutes: number } {
  if (!ATTENDANCE_STATUSES.includes(status)) throw new ValidationError('status_invalid')
  if (status !== 'late') return { status, late_minutes: 0 }

  const minutes = Math.trunc(Number(lateMinutes))
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > MAX_LATE_MINUTES) {
    throw new ValidationError('late_minutes_invalid')
  }
  return { status, late_minutes: minutes }
}
