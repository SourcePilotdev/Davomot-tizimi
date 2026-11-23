/** Barcha yozuvlar ID'si: UUID satri (qarang: lib/id.ts). */
export type ID = string

export const STUDENT_STATUSES = ['active', 'inactive'] as const
export type StudentStatus = (typeof STUDENT_STATUSES)[number]

/** keldi / kelmadi / kech keldi / sababli */
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const LANGUAGES = ['uz', 'en', 'ru', 'tg'] as const
export type Language = (typeof LANGUAGES)[number]

export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

/**
 * Har bir yozuvdagi umumiy maydonlar. `created_at` / `updated_at` — UTC millisekund (Date.now()).
 * `updated_at` kelajakdagi bulut sinxronizatsiyasida "oxirgi yozgan yutadi" qoidasi uchun kerak.
 */
interface BaseEntity {
  id: ID
  created_at: number
  updated_at: number
}

export interface Group extends BaseEntity {
  name: string
}

export interface Student extends BaseEntity {
  group_id: ID
  full_name: string
  phone: string
  parent_phone: string
  status: StudentStatus
}

export interface Lesson extends BaseEntity {
  group_id: ID
  /** Mahalliy sana: "YYYY-MM-DD" (qarang: lib/date.ts) */
  date: string
  topic: string
  /** Mahalliy vaqt: "HH:mm" */
  start_time: string
}

export interface Attendance extends BaseEntity {
  lesson_id: ID
  student_id: ID
  status: AttendanceStatus
  /** Faqat status === 'late' bo'lganda > 0; boshqa holatlarda har doim 0 */
  late_minutes: number
}

/** "Sababli" kelmagan darslar foizga qanday ta'sir qiladi: kelmagan deb hisoblanadi yoki hisobga olinmaydi */
export const EXCUSED_MODES = ['absent', 'ignore'] as const
export type ExcusedMode = (typeof EXCUSED_MODES)[number]

/** Davomat belgisi: holat + (kech kelgan bo'lsa) kechikish daqiqasi */
export type AttendanceMark = Pick<Attendance, 'status' | 'late_minutes'>

/** Ilova sozlamalari (Settings jadvalida "kalit → qiymat" ko'rinishida saqlanadi). */
export interface AppSettings {
  language: Language
  theme: ThemeMode
  /** Oxirgi zaxira nusxasi vaqti (UTC ms) yoki hali olinmagan bo'lsa null */
  lastBackupAt: number | null
  /** Necha kun zaxira nusxasi olinmasa ogohlantirish chiqadi */
  backupReminderDays: number
  excusedMode: ExcusedMode
  /** Shu qurilmaning identifikatori (kelajakdagi sinxronizatsiya uchun) */
  deviceId: string | null
  /** Ilova oxirgi marta ochilgan vaqt (UTC ms): qurilma soati orqaga surilganini aniqlash uchun */
  lastSeenAt: number | null
}

export interface SettingRecord {
  key: string
  value: unknown
  updated_at: number
}
