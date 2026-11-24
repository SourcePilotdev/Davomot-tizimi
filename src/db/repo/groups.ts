import { newId } from '@/lib/id'
import { compareText, normalizeForSearch } from '@/lib/text'
import { db } from '../database'
import type { Group, ID } from '../types'
import { requireText, ValidationError } from '../validation'

export interface GroupInput {
  name: string
}

export async function createGroup(input: GroupInput): Promise<Group> {
  const now = Date.now()
  const group: Group = {
    id: newId(),
    name: requireText(input.name),
    created_at: now,
    updated_at: now,
  }
  await db.groups.add(group)
  return group
}

export async function updateGroup(id: ID, patch: Partial<GroupInput>): Promise<void> {
  const changes: Partial<Group> = { updated_at: Date.now() }
  if (patch.name !== undefined) changes.name = requireText(patch.name)

  const updated = await db.groups.update(id, changes)
  if (updated === 0) throw new ValidationError('group_not_found')
}

/**
 * Guruhni va unga bog'liq HAMMA narsani (o'quvchilar, darslar, davomat yozuvlari) bitta
 * tranzaksiyada o'chiradi: yo xammasi o'chadi, yo hech narsa. Interfeys o'chirishdan oldin
 * tasdiq so'rashi shart.
 */
export async function deleteGroup(id: ID): Promise<void> {
  await db.transaction('rw', [db.groups, db.students, db.lessons, db.attendance], async () => {
    const lessonIds = await db.lessons.where('group_id').equals(id).primaryKeys()
    const studentIds = await db.students.where('group_id').equals(id).primaryKeys()

    await db.attendance.where('lesson_id').anyOf(lessonIds).delete()
    await db.attendance.where('student_id').anyOf(studentIds).delete()
    await db.lessons.where('group_id').equals(id).delete()
    await db.students.where('group_id').equals(id).delete()
    await db.groups.delete(id)
  })
}

export function getGroup(id: ID): Promise<Group | undefined> {
  return db.groups.get(id)
}

/** Barcha guruhlar, nomi bo'yicha tartiblangan. */
export async function listGroups(): Promise<Group[]> {
  const groups = await db.groups.toArray()
  return groups.sort((a, b) => compareText(a.name, b.name))
}

export interface GroupWithStats extends Group {
  /** Guruhdagi barcha o'quvchilar (faol + nofaol) */
  studentCount: number
  inactiveCount: number
}

/** Guruhlar ro'yxati o'quvchilar soni bilan (indeks bo'yicha sanaladi, o'quvchilarni yuklamaydi). */
export async function listGroupsWithStats(): Promise<GroupWithStats[]> {
  const groups = await listGroups()
  return Promise.all(
    groups.map(async (group) => {
      const [active, inactive] = await Promise.all([
        db.students.where('[group_id+status]').equals([group.id, 'active']).count(),
        db.students.where('[group_id+status]').equals([group.id, 'inactive']).count(),
      ])
      return { ...group, studentCount: active + inactive, inactiveCount: inactive }
    }),
  )
}

/** Nomi bo'yicha qidiruv (xotirada). Bo'sh qidiruv — ro'yxat o'zgarishsiz. */
export function filterGroups<T extends { name: string }>(groups: T[], search: string): T[] {
  const query = normalizeForSearch(search)
  return query ? groups.filter((group) => normalizeForSearch(group.name).includes(query)) : groups
}

export interface GroupImpact {
  students: number
  lessons: number
  attendance: number
}

/** Guruh o'chirilsa nimalar birga o'chishini sanaydi — o'chirishdan oldingi tasdiq oynasi uchun. */
export async function getGroupImpact(id: ID): Promise<GroupImpact> {
  const [studentIds, lessonIds] = await Promise.all([
    db.students.where('group_id').equals(id).primaryKeys(),
    db.lessons.where('group_id').equals(id).primaryKeys(),
  ])
  const [byLesson, byStudent] = await Promise.all([
    db.attendance.where('lesson_id').anyOf(lessonIds).primaryKeys(),
    db.attendance.where('student_id').anyOf(studentIds).primaryKeys(),
  ])
  // Bir yozuv ham darsga, ham o'quvchiga bog'liq bo'lishi mumkin — takror sanalmasligi kerak
  return {
    students: studentIds.length,
    lessons: lessonIds.length,
    attendance: new Set([...byLesson, ...byStudent]).size,
  }
}
