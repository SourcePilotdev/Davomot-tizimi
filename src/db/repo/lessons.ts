import Dexie from 'dexie'
import { toLocalDate, toLocalTime } from '@/lib/date'
import { newId } from '@/lib/id'
import { db } from '../database'
import type { ID, Lesson } from '../types'
import { requireDate, requireTime, ValidationError } from '../validation'

export interface LessonInput {
  group_id: ID
  /** "YYYY-MM-DD"; berilmasa — qurilmaning bugungi sanasi */
  date?: string
  topic?: string
  /** "HH:mm"; berilmasa — hozirgi vaqt */
  start_time?: string
}

export interface LessonFilter {
  groupId?: ID
  /** Boshlanish sanasi (shu kun ham kiradi) */
  from?: string
  /** Tugash sanasi (shu kun ham kiradi) */
  to?: string
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  if (!(await db.groups.get(input.group_id))) throw new ValidationError('group_not_found')

  const now = Date.now()
  const lesson: Lesson = {
    id: newId(),
    group_id: input.group_id,
    date: requireDate(input.date ?? toLocalDate()),
    topic: (input.topic ?? '').trim(),
    start_time: requireTime(input.start_time ?? toLocalTime()),
    created_at: now,
    updated_at: now,
  }
  await db.lessons.add(lesson)
  return lesson
}

/** Darsning guruhi o'zgarmaydi: davomat yozuvlari o'sha guruh o'quvchilariga bog'langan. */
export async function updateLesson(id: ID, patch: Partial<Omit<LessonInput, 'group_id'>>): Promise<void> {
  const changes: Partial<Lesson> = { updated_at: Date.now() }
  if (patch.date !== undefined) changes.date = requireDate(patch.date)
  if (patch.topic !== undefined) changes.topic = patch.topic.trim()
  if (patch.start_time !== undefined) changes.start_time = requireTime(patch.start_time)

  const updated = await db.lessons.update(id, changes)
  if (updated === 0) throw new ValidationError('lesson_not_found')
}

/** Darsni va uning barcha davomat yozuvlarini bitta tranzaksiyada o'chiradi. */
export async function deleteLesson(id: ID): Promise<void> {
  await db.transaction('rw', [db.lessons, db.attendance], async () => {
    await db.attendance.where('lesson_id').equals(id).delete()
    await db.lessons.delete(id)
  })
}

export function getLesson(id: ID): Promise<Lesson | undefined> {
  return db.lessons.get(id)
}

/** Darslar tarixi: eng yangisi birinchi (sana, keyin boshlanish vaqti bo'yicha). */
export async function listLessons(filter: LessonFilter = {}): Promise<Lesson[]> {
  const from = filter.from ?? Dexie.minKey
  const to = filter.to ?? Dexie.maxKey

  const lessons = filter.groupId
    ? await db.lessons
        .where('[group_id+date]')
        .between([filter.groupId, from], [filter.groupId, to], true, true)
        .toArray()
    : await db.lessons.where('date').between(from, to, true, true).toArray()

  return lessons.sort((a, b) => b.date.localeCompare(a.date) || b.start_time.localeCompare(a.start_time))
}

/**
 * "Dars boshlash" bir bosishda: guruhning bugungi darsi bor bo'lsa — o'shani qaytaradi (bir nechta bo'lsa,
 * eng oxirgisini), yo'q bo'lsa — hozirgi sana va vaqt bilan yangisini yaratadi. Shuning uchun ikki marta
 * bosish takroriy dars yaratmaydi. Qidirish va yaratish bitta tranzaksiyada.
 */
export function startLesson(groupId: ID): Promise<Lesson> {
  return db.transaction('rw', [db.groups, db.lessons], async () => {
    const existing = await db.lessons.where('[group_id+date]').equals([groupId, toLocalDate()]).toArray()
    if (existing.length > 0) return existing.sort((a, b) => b.start_time.localeCompare(a.start_time))[0]
    return createLesson({ group_id: groupId })
  })
}

export interface LessonImpact {
  attendance: number
}

/** Dars o'chirilsa nechta davomat yozuvi birga o'chishini sanaydi. */
export async function getLessonImpact(id: ID): Promise<LessonImpact> {
  return { attendance: await db.attendance.where('lesson_id').equals(id).count() }
}
