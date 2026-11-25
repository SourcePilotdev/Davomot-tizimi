import { newId } from '@/lib/id'
import { compareText, normalizeForSearch } from '@/lib/text'
import { db } from '../database'
import type { ID, Student, StudentStatus } from '../types'
import { normalizePhone, requireText, ValidationError } from '../validation'

export interface StudentInput {
  group_id: ID
  full_name: string
  phone?: string
  parent_phone?: string
  status?: StudentStatus
}

export interface StudentFilter {
  groupId?: ID
  status?: StudentStatus
  /** Ism yoki telefon raqami bo'yicha qidiruv (katta/kichik harf farqlanmaydi) */
  search?: string
}

async function assertGroupExists(groupId: ID): Promise<void> {
  if (!(await db.groups.get(groupId))) throw new ValidationError('group_not_found')
}

export async function createStudent(input: StudentInput): Promise<Student> {
  await assertGroupExists(input.group_id)

  const now = Date.now()
  const student: Student = {
    id: newId(),
    group_id: input.group_id,
    full_name: requireText(input.full_name),
    phone: normalizePhone(input.phone),
    parent_phone: normalizePhone(input.parent_phone),
    status: input.status ?? 'active',
    created_at: now,
    updated_at: now,
  }
  await db.students.add(student)
  return student
}

/** O'quvchini tahrirlaydi. `group_id` ni o'zgartirish — boshqa guruhga ko'chirish. */
export async function updateStudent(id: ID, patch: Partial<StudentInput>): Promise<void> {
  const changes: Partial<Student> = { updated_at: Date.now() }

  if (patch.group_id !== undefined) {
    await assertGroupExists(patch.group_id)
    changes.group_id = patch.group_id
  }
  if (patch.full_name !== undefined) changes.full_name = requireText(patch.full_name)
  if (patch.phone !== undefined) changes.phone = normalizePhone(patch.phone)
  if (patch.parent_phone !== undefined) changes.parent_phone = normalizePhone(patch.parent_phone)
  if (patch.status !== undefined) changes.status = patch.status

  const updated = await db.students.update(id, changes)
  if (updated === 0) throw new ValidationError('student_not_found')
}

/** O'quvchini va uning barcha davomat yozuvlarini bitta tranzaksiyada o'chiradi. */
export async function deleteStudent(id: ID): Promise<void> {
  await db.transaction('rw', [db.students, db.attendance], async () => {
    await db.attendance.where('student_id').equals(id).delete()
    await db.students.delete(id)
  })
}

export function getStudent(id: ID): Promise<Student | undefined> {
  return db.students.get(id)
}

/**
 * Ro'yxatni xotirada filtrlaydi: guruh, holat va qidiruv (ism yoki telefon).
 * Interfeysda har bir harf bosilganda bazaga murojaat qilmaslik uchun: ro'yxat bir marta
 * o'qiladi, qidiruv esa shu funksiya bilan bajariladi. Tartib o'zgarmaydi.
 */
export function filterStudents(students: Student[], filter: StudentFilter): Student[] {
  const { groupId, status } = filter
  const raw = filter.search?.trim() ?? ''
  const query = normalizeForSearch(raw)
  // Faqat raqam/belgilardan iborat qidiruv — telefon bo'yicha: "+998 90" → "99890"
  const phoneQuery = /^[\d\s+()-]+$/.test(raw) ? raw.replace(/\D/g, '') : ''
  const hasDigits = (phone: string) => phone.replace(/\D/g, '').includes(phoneQuery)

  return students.filter((student) => {
    if (groupId && student.group_id !== groupId) return false
    if (status && student.status !== status) return false
    if (!query) return true
    return (
      normalizeForSearch(student.full_name).includes(query) ||
      (phoneQuery !== '' && (hasDigits(student.phone) || hasDigits(student.parent_phone)))
    )
  })
}

/** O'quvchilar ro'yxati (ism bo'yicha tartiblangan). Filtrlar ixtiyoriy va birga ishlaydi. */
export async function listStudents(filter: StudentFilter = {}): Promise<Student[]> {
  const { groupId, status } = filter

  let students: Student[]
  if (groupId && status) {
    students = await db.students.where('[group_id+status]').equals([groupId, status]).toArray()
  } else if (groupId) {
    students = await db.students.where('group_id').equals(groupId).toArray()
  } else if (status) {
    students = await db.students.where('status').equals(status).toArray()
  } else {
    students = await db.students.toArray()
  }

  return filterStudents(students, { search: filter.search }).sort((a, b) => compareText(a.full_name, b.full_name))
}

export interface StudentImpact {
  attendance: number
}

/** O'quvchi o'chirilsa nechta davomat yozuvi birga o'chishini sanaydi. */
export async function getStudentImpact(id: ID): Promise<StudentImpact> {
  return { attendance: await db.attendance.where('student_id').equals(id).count() }
}
