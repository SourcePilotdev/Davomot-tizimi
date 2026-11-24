import { db } from './database'

/** Guruh, o'quvchi, dars va davomat ma'lumotlarini o'chiradi (sozlamalar qoladi). */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.groups, db.students, db.lessons, db.attendance], async () => {
    await db.attendance.clear()
    await db.lessons.clear()
    await db.students.clear()
    await db.groups.clear()
  })
}
