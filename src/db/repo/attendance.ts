import { compareText } from '@/lib/text'
import { db } from '../database'
import type { Attendance, AttendanceStatus, Group, ID, Lesson, Student } from '../types'
import { normalizeAttendance, ValidationError } from '../validation'
import { listLessons, type LessonFilter } from './lessons'

export interface AttendanceInput {
  student_id: ID
  status: AttendanceStatus
  /** Faqat status === 'late' uchun majburiy (1…600) */
  late_minutes?: number
}

/**
 * Bitta dars + bitta o'quvchi = bitta yozuv. ID deterministik, shuning uchun qayta saqlash
 * takroriy yozuv yaratmaydi, balki mavjudini yangilaydi (upsert).
 */
export function attendanceId(lessonId: ID, studentId: ID): ID {
  return `${lessonId}_${studentId}`
}

export function getLessonAttendance(lessonId: ID): Promise<Attendance[]> {
  return db.attendance.where('lesson_id').equals(lessonId).toArray()
}

export function getStudentAttendance(studentId: ID): Promise<Attendance[]> {
  return db.attendance.where('student_id').equals(studentId).toArray()
}

/**
 * Dars davomatini saqlaydi (bir nechta o'quvchi uchun bir tranzaksiyada).
 * Hamma yozuv tekshiriladi; bittasi noto'g'ri bo'lsa, HECH NARSA saqlanmaydi.
 */
export async function saveLessonAttendance(lessonId: ID, records: AttendanceInput[]): Promise<void> {
  if (records.length === 0) return

  const normalized = records.map((record) => ({
    student_id: record.student_id,
    ...normalizeAttendance(record.status, record.late_minutes),
  }))

  await db.transaction('rw', [db.lessons, db.students, db.attendance], async () => {
    if (!(await db.lessons.get(lessonId))) throw new ValidationError('lesson_not_found')

    const students = await db.students.bulkGet(normalized.map((record) => record.student_id))
    if (students.some((student) => !student)) throw new ValidationError('student_not_found')

    // Mavjud yozuvlarning created_at qiymati saqlanib qoladi
    const existing = await db.attendance.where('lesson_id').equals(lessonId).toArray()
    const createdAt = new Map(existing.map((a) => [a.id, a.created_at] as const))
    const now = Date.now()

    await db.attendance.bulkPut(
      normalized.map((record): Attendance => {
        const id = attendanceId(lessonId, record.student_id)
        return {
          id,
          lesson_id: lessonId,
          student_id: record.student_id,
          status: record.status,
          late_minutes: record.late_minutes,
          created_at: createdAt.get(id) ?? now,
          updated_at: now,
        }
      }),
    )
  })
}

/** Bitta o'quvchining holatini belgilaydi (tez bosish — darhol saqlash uchun). */
export function setAttendance(lessonId: ID, record: AttendanceInput): Promise<void> {
  return saveLessonAttendance(lessonId, [record])
}

/** O'quvchi belgisini olib tashlaydi (hali belgilanmagan holatga qaytaradi). */
export async function clearAttendance(lessonId: ID, studentId: ID): Promise<void> {
  await db.attendance.delete(attendanceId(lessonId, studentId))
}

/** Har bir holat bo'yicha soni: { present, absent, late, excused } */
export type AttendanceCounts = Record<AttendanceStatus, number>

export function countStatuses(records: Pick<Attendance, 'status'>[]): AttendanceCounts {
  const counts: AttendanceCounts = { present: 0, absent: 0, late: 0, excused: 0 }
  for (const record of records) counts[record.status]++
  return counts
}

export interface LessonSheet {
  lesson: Lesson
  group: Group | null
  /** Davomat ro'yxati: guruhning FAOL o'quvchilari + bu darsda belgisi bor o'quvchilar (nofaol yoki ko'chirilgan bo'lsa ham) */
  students: Student[]
  records: Attendance[]
}

/**
 * Davomat belgilash ekrani uchun hamma kerakli ma'lumot bir so'rovda. Dars topilmasa — null.
 * Nofaol o'quvchi yangi darsning ro'yxatida chiqmaydi, lekin unga belgi qo'yilgan bo'lsa, o'sha
 * darsda ko'rinishda qoladi (tarix buzilmasligi uchun).
 */
export async function getLessonSheet(lessonId: ID): Promise<LessonSheet | null> {
  const lesson = await db.lessons.get(lessonId)
  if (!lesson) return null

  const [group, active, records] = await Promise.all([
    db.groups.get(lesson.group_id),
    db.students.where('[group_id+status]').equals([lesson.group_id, 'active']).toArray(),
    db.attendance.where('lesson_id').equals(lessonId).toArray(),
  ])

  const listed = new Set(active.map((student) => student.id))
  const extraIds = records.map((record) => record.student_id).filter((id) => !listed.has(id))
  const extra = extraIds.length > 0 ? (await db.students.bulkGet(extraIds)).filter((s): s is Student => s !== undefined) : []

  const students = [...active, ...extra].sort((a, b) => compareText(a.full_name, b.full_name))
  return { lesson, group: group ?? null, students, records }
}

export interface LessonSummary {
  lesson: Lesson
  groupName: string
  counts: AttendanceCounts
  /** Belgilangan o'quvchilar soni */
  marked: number
}

/** Darslar ro'yxati (eng yangisi birinchi) guruh nomi va davomat hisobi bilan. */
export async function listLessonSummaries(filter: LessonFilter & { limit?: number } = {}): Promise<LessonSummary[]> {
  const { limit, ...lessonFilter } = filter
  const lessons = (await listLessons(lessonFilter)).slice(0, limit)

  const groupIds = [...new Set(lessons.map((lesson) => lesson.group_id))]
  const groups = await db.groups.bulkGet(groupIds)
  const names = new Map(groups.flatMap((group) => (group ? [[group.id, group.name] as const] : [])))

  return Promise.all(
    lessons.map(async (lesson) => {
      const records = await db.attendance.where('lesson_id').equals(lesson.id).toArray()
      return { lesson, groupName: names.get(lesson.group_id) ?? '', counts: countStatuses(records), marked: records.length }
    }),
  )
}
