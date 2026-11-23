import { clockBehindSince } from '@/lib/clock'
import { newId } from '@/lib/id'
import { db } from './database'
import { getSettings, updateSettings } from './repo/settings'

/**
 * Brauzerdan "doimiy xotira" so'raydi. Aks holda xotira kamayganda brauzer sayt ma'lumotlarini
 * (shu jumladan davomat bazasini) so'ramasdan o'chirib yuborishi mumkin. Chrome/Android'da
 * bosh ekranga o'rnatilgan ilovalarga odatda avtomatik beriladi.
 */
async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

/**
 * Ilova ishga tushganda bir marta chaqiriladi: bazani ochadi, qurilma ID'sini yaratadi,
 * doimiy xotira so'raydi va qurilma soati orqaga surilmaganini tekshiradi.
 * Baza ochilmasa (masalan, maxfiy rejim, xotira to'lgan) xatoni yuqoriga uzatadi —
 * interfeys xato ekranini ko'rsatadi.
 */
export async function initDatabase(): Promise<{ persisted: boolean; clockIssueSince: number | null }> {
  await db.open()

  const settings = await getSettings()
  const now = Date.now()
  const clockIssueSince = clockBehindSince(settings.lastSeenAt, now)

  await updateSettings({
    ...(settings.deviceId ? {} : { deviceId: newId() }),
    // Soat orqada bo'lsa, lastSeenAt kamaymaydi: ogohlantirish soat to'g'rilanguncha ko'rsatilaveradi
    lastSeenAt: Math.max(now, settings.lastSeenAt ?? 0),
  })

  return { persisted: await requestPersistentStorage(), clockIssueSince }
}
