import { addDays, toLocalDate } from '@/lib/date'
import { saveLessonAttendance } from './repo/attendance'
import { createGroup } from './repo/groups'
import { createLesson } from './repo/lessons'
import { createStudent } from './repo/students'
import type { AttendanceStatus, Student } from './types'

const GROUP_NAMES = ['Ingliz tili A2', 'Matematika 9-sinf']

const STUDENT_NAMES = [
  'Aziza Karimova',
  'Bobur Rahimov',
  'Dilnoza Yusupova',
  "Eldor To'xtayev",
  'Feruza Abdullayeva',
  "G'ayrat Saidov",
  'Hasan Ismoilov',
  'Iroda Mirzayeva',
  'Jasur Nazarov',
  'Kamola Sobirova',
  'Laziz Qodirov',
  'Malika Ergasheva',
]

function randomAttendance(): { status: AttendanceStatus; late_minutes: number } {
  const roll = Math.random()
  if (roll < 0.7) return { status: 'present', late_minutes: 0 }
  if (roll < 0.82) return { status: 'absent', late_minutes: 0 }
  if (roll < 0.93) return { status: 'late', late_minutes: 5 + Math.floor(Math.random() * 20) }
  return { status: 'excused', late_minutes: 0 }
}

/**
 * FAQAT ISHLAB CHIQISH UCHUN: 2 ta guruh, 12 ta o'quvchi, 8 ta dars va tasodifiy davomat yaratadi.
 * Keyingi bosqichlarda interfeysni haqiqiy ma'lumot bilan sinash uchun qulay.
 */
export async function seedDemoData(): Promise<void> {
  const today = toLocalDate()

  for (const [index, name] of GROUP_NAMES.entries()) {
    const group = await createGroup({ name })

    const students: Student[] = []
    for (const full_name of STUDENT_NAMES.slice(index * 6, index * 6 + 6)) {
      students.push(
        await createStudent({
          group_id: group.id,
          full_name,
          phone: '+998901234567',
          parent_phone: '+998931234567',
        }),
      )
    }

    for (let i = 0; i < 4; i++) {
      const lesson = await createLesson({
        group_id: group.id,
        date: addDays(today, -3 * i),
        topic: `${4 - i}-dars mavzusi`,
        start_time: index === 0 ? '15:00' : '17:30',
      })
      await saveLessonAttendance(
        lesson.id,
        students.map((student) => ({ student_id: student.id, ...randomAttendance() })),
      )
    }
  }
}
