import { startOfMonth } from '@/lib/date'
import { compareText } from '@/lib/text'
import { db } from './database'
import { countStatuses, type AttendanceCounts, type LessonSummary } from './repo/attendance'
import { listLessons } from './repo/lessons'
import type { Attendance, AttendanceMark, AttendanceStatus, ExcusedMode, ID, Lesson, Student } from './types'

/** Dashboard'dagi "e'tibor talab qiladi" ro'yxati: davomat shu foizdan past va kamida shuncha belgisi bor o'quvchilar. */
export const ATTENTION_RATE = 75
export const ATTENTION_MIN_MARKS = 3

const emptyCounts = (): AttendanceCounts => ({ present: 0, absent: 0, late: 0, excused: 0 })

/**
 * Davomat foizi = (Keldi + Kech keldi) / (Keldi + Kech keldi + Kelmadi [+ Sababli]) × 100.
 * "Kech keldi" — darsga kelgan. "Sababli" mode === 'absent' bo'lsa kelmagan hisoblanadi, 'ignore' bo'lsa
 * maxrajga kirmaydi. Hisoblash uchun ma'lumot bo'lmasa — null.
 */
export function attendanceRate(counts: AttendanceCounts, mode: ExcusedMode): number | null {
  const attended = counts.present + counts.late
  const total = attended + counts.absent + (mode === 'absent' ? counts.excused : 0)
  return total === 0 ? null : (attended / total) * 100
}

/** Qoldirilgan darslar: Kelmadi (+ Sababli, agar kelmagan deb hisoblansa). */
export function missedCount(counts: AttendanceCounts, mode: ExcusedMode): number {
  return counts.absent + (mode === 'absent' ? counts.excused : 0)
}

export interface MonthlyRate {
  /** "2026-11" */
  month: string
  counts: AttendanceCounts
  rate: number | null
}

/** Belgilarni oylar bo'yicha guruhlab, har oy uchun foizni hisoblaydi (eski oydan yangisiga). */
export function monthlyRates(entries: { date: string; status: AttendanceStatus }[], mode: ExcusedMode): MonthlyRate[] {
  const byMonth = new Map<string, AttendanceCounts>()
  for (const { date, status } of entries) {
    const key = date.slice(0, 7)
    const counts = byMonth.get(key) ?? emptyCounts()
    counts[status]++
    byMonth.set(key, counts)
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({ month, counts, rate: attendanceRate(counts, mode) }))
}

export interface ReportFilter {
  groupId?: ID
  from?: string
  to?: string
}

export interface StudentStats {
  student: Student
  groupName: string
  counts: AttendanceCounts
  /** Belgilangan darslar soni */
  marked: number
  lateMinutes: number
  rate: number | null
}

export interface ReportSummary {
  lessons: number
  marks: number
  counts: AttendanceCounts
  rate: number | null
}

export interface AttendanceReport {
  summary: ReportSummary
  /** Davrda belgisi bor o'quvchilar + guruhlarning faol o'quvchilari (ism bo'yicha) */
  students: StudentStats[]
  /** Davrdagi darslar, eng yangisi birinchi */
  lessons: LessonSummary[]
}

/** Davr va guruh bo'yicha hisobot: umumiy foiz, har bir o'quvchi statistikasi va darslar tarixi. */
export async function getAttendanceReport(filter: ReportFilter, mode: ExcusedMode): Promise<AttendanceReport> {
  const lessons = await listLessons(filter)
  const lessonIds = lessons.map((lesson) => lesson.id)
  const records = lessonIds.length > 0 ? await db.attendance.where('lesson_id').anyOf(lessonIds).toArray() : []

  const groups = await db.groups.toArray()
  const groupNames = new Map(groups.map((group) => [group.id, group.name] as const))

  const byLesson = new Map<ID, Attendance[]>()
  const byStudent = new Map<ID, { counts: AttendanceCounts; lateMinutes: number }>()
  for (const record of records) {
    const list = byLesson.get(record.lesson_id) ?? []
    list.push(record)
    byLesson.set(record.lesson_id, list)

    const entry = byStudent.get(record.student_id) ?? { counts: emptyCounts(), lateMinutes: 0 }
    entry.counts[record.status]++
    entry.lateMinutes += record.late_minutes
    byStudent.set(record.student_id, entry)
  }

  // Ro'yxat: faol o'quvchilar + davrda belgisi bor o'quvchilar (nofaol yoki ko'chirilgan bo'lsa ham)
  const active = filter.groupId
    ? await db.students.where('[group_id+status]').equals([filter.groupId, 'active']).toArray()
    : await db.students.where('status').equals('active').toArray()
  const listed = new Set(active.map((student) => student.id))
  const extraIds = [...byStudent.keys()].filter((id) => !listed.has(id))
  const extra = extraIds.length > 0 ? (await db.students.bulkGet(extraIds)).filter((s): s is Student => s !== undefined) : []

  const students = [...active, ...extra]
    .map((student): StudentStats => {
      const entry = byStudent.get(student.id) ?? { counts: emptyCounts(), lateMinutes: 0 }
      const marked = entry.counts.present + entry.counts.absent + entry.counts.late + entry.counts.excused
      return {
        student,
        groupName: groupNames.get(student.group_id) ?? '',
        counts: entry.counts,
        marked,
        lateMinutes: entry.lateMinutes,
        rate: attendanceRate(entry.counts, mode),
      }
    })
    .sort((a, b) => compareText(a.student.full_name, b.student.full_name))

  const counts = countStatuses(records)
  return {
    summary: { lessons: lessons.length, marks: records.length, counts, rate: attendanceRate(counts, mode) },
    students,
    lessons: lessons.map((lesson) => {
      const own = byLesson.get(lesson.id) ?? []
      return { lesson, groupName: groupNames.get(lesson.group_id) ?? '', counts: countStatuses(own), marked: own.length }
    }),
  }
}

export interface StudentHistoryEntry {
  lesson: Lesson
  mark: AttendanceMark
}

export interface StudentReport {
  student: Student
  groupName: string
  counts: AttendanceCounts
  marked: number
  lateMinutes: number
  rate: number | null
  /** Davrdagi belgilar, eng yangisi birinchi */
  history: StudentHistoryEntry[]
  months: MonthlyRate[]
}

/** Bitta o'quvchi: davr bo'yicha foiz, belgilar tarixi va oylar bo'yicha foiz. O'quvchi topilmasa — null. */
export async function getStudentReport(
  studentId: ID,
  range: { from?: string; to?: string },
  mode: ExcusedMode,
): Promise<StudentReport | null> {
  const student = await db.students.get(studentId)
  if (!student) return null

  const [group, records] = await Promise.all([db.groups.get(student.group_id), db.attendance.where('student_id').equals(studentId).toArray()])
  const lessons = await db.lessons.bulkGet(records.map((record) => record.lesson_id))
  const lessonById = new Map(lessons.flatMap((lesson) => (lesson ? [[lesson.id, lesson] as const] : [])))

  const history: StudentHistoryEntry[] = records
    .flatMap((record) => {
      const lesson = lessonById.get(record.lesson_id)
      if (!lesson || (range.from && lesson.date < range.from) || (range.to && lesson.date > range.to)) return []
      return [{ lesson, mark: { status: record.status, late_minutes: record.late_minutes } }]
    })
    .sort((a, b) => b.lesson.date.localeCompare(a.lesson.date) || b.lesson.start_time.localeCompare(a.lesson.start_time))

  const counts = countStatuses(history.map((entry) => entry.mark))
  return {
    student,
    groupName: group?.name ?? '',
    counts,
    marked: history.length,
    lateMinutes: history.reduce((sum, entry) => sum + entry.mark.late_minutes, 0),
    rate: attendanceRate(counts, mode),
    history,
    months: monthlyRates(history.map((entry) => ({ date: entry.lesson.date, status: entry.mark.status })), mode),
  }
}

export interface Dashboard {
  groups: number
  /** Faol o'quvchilar soni */
  students: number
  monthLessons: number
  monthRate: number | null
  monthCounts: AttendanceCounts
  /** Bugungi darslar (vaqt bo'yicha) */
  today: LessonSummary[]
  /** Shu oy davomati past o'quvchilar (eng pasti birinchi, 5 tagacha) */
  attention: StudentStats[]
}

/** Bosh sahifa uchun asosiy ko'rsatkichlar. */
export async function getDashboard(today: string, mode: ExcusedMode): Promise<Dashboard> {
  const [groups, students, report] = await Promise.all([
    db.groups.count(),
    db.students.where('status').equals('active').count(),
    getAttendanceReport({ from: startOfMonth(today), to: today }, mode),
  ])

  const attention = report.students
    .filter((s) => s.marked >= ATTENTION_MIN_MARKS && s.rate !== null && s.rate < ATTENTION_RATE)
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0) || compareText(a.student.full_name, b.student.full_name))
    .slice(0, 5)

  return {
    groups,
    students,
    monthLessons: report.summary.lessons,
    monthRate: report.summary.rate,
    monthCounts: report.summary.counts,
    today: report.lessons.filter((l) => l.lesson.date === today).sort((a, b) => a.lesson.start_time.localeCompare(b.lesson.start_time)),
    attention,
  }
}

export interface AttendanceTableRow {
  date: string
  time: string
  group: string
  topic: string
  student: string
  status: AttendanceStatus
  lateMinutes: number
}

/** Barcha davomat yozuvlari bitta tekis jadval sifatida (CSV eksport uchun): sana, vaqt, guruh, o'quvchi tartibida. */
export async function listAttendanceRows(): Promise<AttendanceTableRow[]> {
  const [groups, students, lessons, records] = await Promise.all([
    db.groups.toArray(),
    db.students.toArray(),
    db.lessons.toArray(),
    db.attendance.toArray(),
  ])
  const groupName = new Map(groups.map((g) => [g.id, g.name] as const))
  const studentName = new Map(students.map((s) => [s.id, s.full_name] as const))
  const lessonById = new Map(lessons.map((l) => [l.id, l] as const))

  return records
    .flatMap((record) => {
      const lesson = lessonById.get(record.lesson_id)
      if (!lesson) return []
      return [
        {
          date: lesson.date,
          time: lesson.start_time,
          group: groupName.get(lesson.group_id) ?? '',
          topic: lesson.topic,
          student: studentName.get(record.student_id) ?? '',
          status: record.status,
          lateMinutes: record.late_minutes,
        },
      ]
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time) ||
        compareText(a.group, b.group) ||
        compareText(a.student, b.student),
    )
}
