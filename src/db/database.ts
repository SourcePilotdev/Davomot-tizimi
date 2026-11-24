import Dexie, { type Table } from 'dexie'
import type { Attendance, Group, Lesson, SettingRecord, Student } from './types'

export const DB_NAME = 'davomat-tizimi'

/**
 * Mahalliy ma'lumotlar bazasi (IndexedDB, Dexie orqali).
 * Komponentlar `db` ga to'g'ridan-to'g'ri murojaat qilmaydi — `db/repo/*` funksiyalaridan foydalaning.
 */
export const db = new Dexie(DB_NAME) as Dexie & {
  groups: Table<Group, string>
  students: Table<Student, string>
  lessons: Table<Lesson, string>
  attendance: Table<Attendance, string>
  settings: Table<SettingRecord, string>
}

/**
 * Sxema versiyasi 1.
 * Faqat so'rovlarda ishlatiladigan maydonlar indekslanadi (indeks — yozishni sekinlashtiradi).
 *
 * Sxemani o'zgartirganda eski versiyani O'CHIRMANG — yangisini qo'shing:
 *   db.version(2).stores({ students: 'id, group_id, status, full_name, [group_id+status]' })
 *     .upgrade(tx => tx.table('students').toCollection().modify(s => { ... }))
 * Shunda foydalanuvchilar telefonidagi mavjud ma'lumotlar yangilanishda saqlanib qoladi.
 */
db.version(1).stores({
  groups: 'id, name, created_at',
  students: 'id, group_id, status, full_name, [group_id+status]',
  lessons: 'id, group_id, date, [group_id+date]',
  attendance: 'id, lesson_id, student_id, status, [student_id+status]',
  settings: 'key',
})
