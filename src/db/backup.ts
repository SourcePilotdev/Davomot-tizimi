import { isValidDate, isValidTime, toLocalDate, toLocalTime } from '@/lib/date'
import { db } from './database'
import { attendanceId } from './repo/attendance'
import { getSettings, updateSettings } from './repo/settings'
import {
  ATTENDANCE_STATUSES,
  EXCUSED_MODES,
  LANGUAGES,
  STUDENT_STATUSES,
  THEME_MODES,
  type AppSettings,
  type Attendance,
  type Group,
  type Lesson,
  type Student,
} from './types'
import { MAX_LATE_MINUTES, normalizePhone } from './validation'

export const BACKUP_FORMAT = 'davomat-zaxira'
export const BACKUP_VERSION = 1
/** Zaxira fayli (belgilar soni) shundan katta bo'lsa o'qilmaydi: telefon xotirasini to'ldirib yubormaslik uchun. */
export const MAX_BACKUP_CHARS = 30 * 1024 * 1024

export interface BackupData {
  groups: Group[]
  students: Student[]
  lessons: Lesson[]
  attendance: Attendance[]
}

/** Zaxiraga faqat foydalanuvchi tanlovlari kiradi. Qurilmaga xos qiymatlar (deviceId, lastSeenAt) kirmaydi. */
export type BackupSettings = Partial<Pick<AppSettings, 'language' | 'theme' | 'excusedMode' | 'backupReminderDays'>>

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: number
  /** Zaxira yaratilgan vaqt (UTC ms) */
  createdAt: number
  data: BackupData
  settings: BackupSettings
}

export interface BackupCounts {
  groups: number
  students: number
  lessons: number
  attendance: number
}

/** Hozirgi ma'lumotlarning to'liq nusxasi (bitta o'qish tranzaksiyasida, shuning uchun izchil). */
export async function createBackup(): Promise<BackupFile> {
  const { data, settings } = await db.transaction('r', [db.groups, db.students, db.lessons, db.attendance, db.settings], async () => {
    const [groups, students, lessons, attendance] = await Promise.all([
      db.groups.toArray(),
      db.students.toArray(),
      db.lessons.toArray(),
      db.attendance.toArray(),
    ])
    return { data: { groups, students, lessons, attendance }, settings: await getSettings() }
  })
  const { language, theme, excusedMode, backupReminderDays } = settings
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: Date.now(),
    data,
    settings: { language, theme, excusedMode, backupReminderDays },
  }
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup)
}

/** "davomat-zaxira-2026-11-17-1530.json" */
export function backupFilename(createdAt: number): string {
  const moment = new Date(createdAt)
  return `davomat-zaxira-${toLocalDate(moment)}-${toLocalTime(moment).replace(':', '')}.json`
}

/** Zaxira olingan vaqtni eslab qoladi (eslatma tizimi va "Oxirgi zaxira" yozuvi uchun). */
export async function markBackupSaved(at: number): Promise<void> {
  await updateSettings({ lastBackupAt: at })
}

export function countBackup(backup: BackupFile): BackupCounts {
  const { groups, students, lessons, attendance } = backup.data
  return { groups: groups.length, students: students.length, lessons: lessons.length, attendance: attendance.length }
}

export async function getDataCounts(): Promise<BackupCounts> {
  const [groups, students, lessons, attendance] = await Promise.all([
    db.groups.count(),
    db.students.count(),
    db.lessons.count(),
    db.attendance.count(),
  ])
  return { groups, students, lessons, attendance }
}

// ───────────────────────── Zaxira faylini tekshirish ─────────────────────────
// Fayl tashqaridan keladi, unga ishonib bo'lmaydi: har bir maydon tekshiriladi, ortiqcha maydonlar tashlanadi,
// bog'lanishlar (o'quvchi → guruh, davomat → dars va o'quvchi) tekshiriladi. Birorta xato bo'lsa — hech narsa tiklanmaydi.

export type BackupErrorCode =
  | 'invalid_json'
  | 'not_a_backup'
  | 'unsupported_version'
  | 'invalid_data'
  | 'broken_references'
  | 'too_large'

export type BackupParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; code: BackupErrorCode; /** Xato qaysi joyda (masalan, "data.students[3].full_name") */ detail?: string }

class InvalidBackup extends Error {
  readonly code: 'invalid_data' | 'broken_references'
  readonly detail: string

  constructor(code: 'invalid_data' | 'broken_references', detail: string) {
    super(detail)
    this.name = 'InvalidBackup'
    this.code = code
    this.detail = detail
  }
}

function bad(path: string): never {
  throw new InvalidBackup('invalid_data', path)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function readText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') bad(path)
  return value.trim()
}

function readOptionalText(value: unknown, path: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') bad(path)
  return value.trim()
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) bad(path)
  return value
}

function readOneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  const found = allowed.find((option) => option === value)
  if (found === undefined) bad(path)
  return found
}

function readList(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) bad(path)
  return value
}

function readBase(item: unknown, path: string) {
  if (!isRecord(item)) bad(path)
  return {
    raw: item,
    id: readText(item.id, `${path}.id`),
    created_at: readNumber(item.created_at, `${path}.created_at`),
    updated_at: readNumber(item.updated_at, `${path}.updated_at`),
  }
}

function readGroups(list: unknown[]): Group[] {
  return list.map((item, i) => {
    const path = `data.groups[${i}]`
    const { raw, ...base } = readBase(item, path)
    return { ...base, name: readText(raw.name, `${path}.name`).replace(/\s+/g, ' ') }
  })
}

function readStudents(list: unknown[]): Student[] {
  return list.map((item, i) => {
    const path = `data.students[${i}]`
    const { raw, ...base } = readBase(item, path)
    return {
      ...base,
      group_id: readText(raw.group_id, `${path}.group_id`),
      full_name: readText(raw.full_name, `${path}.full_name`).replace(/\s+/g, ' '),
      phone: normalizePhone(readOptionalText(raw.phone, `${path}.phone`)),
      parent_phone: normalizePhone(readOptionalText(raw.parent_phone, `${path}.parent_phone`)),
      status: readOneOf(raw.status, STUDENT_STATUSES, `${path}.status`),
    }
  })
}

function readLessons(list: unknown[]): Lesson[] {
  return list.map((item, i) => {
    const path = `data.lessons[${i}]`
    const { raw, ...base } = readBase(item, path)
    const date = readText(raw.date, `${path}.date`)
    const startTime = readText(raw.start_time, `${path}.start_time`)
    if (!isValidDate(date)) bad(`${path}.date`)
    if (!isValidTime(startTime)) bad(`${path}.start_time`)
    return {
      ...base,
      group_id: readText(raw.group_id, `${path}.group_id`),
      date,
      topic: readOptionalText(raw.topic, `${path}.topic`),
      start_time: startTime,
    }
  })
}

function readAttendance(list: unknown[]): Attendance[] {
  return list.map((item, i) => {
    const path = `data.attendance[${i}]`
    const { raw, ...base } = readBase(item, path)
    const status = readOneOf(raw.status, ATTENDANCE_STATUSES, `${path}.status`)
    let lateMinutes = 0
    if (status === 'late') {
      lateMinutes = readNumber(raw.late_minutes, `${path}.late_minutes`)
      if (!Number.isInteger(lateMinutes) || lateMinutes < 1 || lateMinutes > MAX_LATE_MINUTES) bad(`${path}.late_minutes`)
    }
    return {
      ...base,
      lesson_id: readText(raw.lesson_id, `${path}.lesson_id`),
      student_id: readText(raw.student_id, `${path}.student_id`),
      status,
      late_minutes: lateMinutes,
    }
  })
}

function assertUniqueIds(items: { id: string }[], path: string): void {
  const seen = new Set<string>()
  items.forEach((item, i) => {
    if (seen.has(item.id)) bad(`${path}[${i}].id`)
    seen.add(item.id)
  })
}

function assertReferences(data: BackupData): void {
  const groupIds = new Set(data.groups.map((group) => group.id))
  const studentIds = new Set(data.students.map((student) => student.id))
  const lessonIds = new Set(data.lessons.map((lesson) => lesson.id))
  const students = data.students.filter((student) => !groupIds.has(student.group_id)).length
  const lessons = data.lessons.filter((lesson) => !groupIds.has(lesson.group_id)).length
  const attendance = data.attendance.filter((a) => !lessonIds.has(a.lesson_id) || !studentIds.has(a.student_id)).length
  if (students + lessons + attendance > 0) {
    throw new InvalidBackup('broken_references', `students: ${students}, lessons: ${lessons}, attendance: ${attendance}`)
  }
}

/** Bir dars + bir o'quvchi uchun bitta yozuv qoladi (eng yangisi); ID standart ko'rinishga keltiriladi. */
function dedupeAttendance(records: Attendance[]): Attendance[] {
  const byPair = new Map<string, Attendance>()
  for (const record of records) {
    const id = attendanceId(record.lesson_id, record.student_id)
    const previous = byPair.get(id)
    if (!previous || record.updated_at >= previous.updated_at) byPair.set(id, { ...record, id })
  }
  return [...byPair.values()]
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.find((option) => option === value)
}

function readSettings(raw: unknown): BackupSettings {
  if (!isRecord(raw)) return {}
  const out: BackupSettings = {}
  const language = pick(raw.language, LANGUAGES)
  if (language) out.language = language
  const theme = pick(raw.theme, THEME_MODES)
  if (theme) out.theme = theme
  const excusedMode = pick(raw.excusedMode, EXCUSED_MODES)
  if (excusedMode) out.excusedMode = excusedMode
  const days = raw.backupReminderDays
  if (typeof days === 'number' && Number.isInteger(days) && days >= 1 && days <= 365) out.backupReminderDays = days
  return out
}

/** Zaxira faylining matnini tekshiradi va toza BackupFile qaytaradi (yoki xato kodi va joyini). */
export function parseBackup(text: string): BackupParseResult {
  if (text.length > MAX_BACKUP_CHARS) return { ok: false, code: 'too_large' }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, code: 'invalid_json' }
  }
  if (!isRecord(json) || json.format !== BACKUP_FORMAT) return { ok: false, code: 'not_a_backup' }

  const version = json.version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, code: 'invalid_data', detail: 'version' }
  }
  if (version > BACKUP_VERSION) return { ok: false, code: 'unsupported_version' }

  try {
    const createdAt = readNumber(json.createdAt, 'createdAt')
    const data = isRecord(json.data) ? json.data : bad('data')
    const groups = readGroups(readList(data.groups, 'data.groups'))
    const students = readStudents(readList(data.students, 'data.students'))
    const lessons = readLessons(readList(data.lessons, 'data.lessons'))
    const attendance = readAttendance(readList(data.attendance, 'data.attendance'))

    assertUniqueIds(groups, 'data.groups')
    assertUniqueIds(students, 'data.students')
    assertUniqueIds(lessons, 'data.lessons')
    assertUniqueIds(attendance, 'data.attendance')

    const clean: BackupData = { groups, students, lessons, attendance: dedupeAttendance(attendance) }
    assertReferences(clean)

    return {
      ok: true,
      backup: { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt, data: clean, settings: readSettings(json.settings) },
    }
  } catch (error) {
    if (error instanceof InvalidBackup) return { ok: false, code: error.code, detail: error.detail }
    throw error
  }
}

/**
 * Zaxiradan tiklaydi: hozirgi ma'lumotlar TO'LIQ almashtiriladi. Hammasi bitta tranzaksiyada: yozish
 * o'rtasida xato bo'lsa, hozirgi ma'lumotlar o'zgarmay qoladi. Qurilma sozlamalari (deviceId, lastSeenAt)
 * saqlanadi, "oxirgi zaxira" vaqti zaxira yaratilgan vaqtga tenglashtiriladi.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { groups, students, lessons, attendance } = backup.data
  await db.transaction('rw', [db.groups, db.students, db.lessons, db.attendance, db.settings], async () => {
    await Promise.all([db.attendance.clear(), db.lessons.clear(), db.students.clear(), db.groups.clear()])
    await db.groups.bulkPut(groups)
    await db.students.bulkPut(students)
    await db.lessons.bulkPut(lessons)
    await db.attendance.bulkPut(attendance)
    await updateSettings({ ...backup.settings, lastBackupAt: backup.createdAt })
  })
}
