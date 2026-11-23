import { db } from '../database'
import { EXCUSED_MODES, LANGUAGES, THEME_MODES, type AppSettings } from '../types'

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'uz',
  theme: 'system',
  lastBackupAt: null,
  backupReminderDays: 7,
  excusedMode: 'absent',
  deviceId: null,
  lastSeenAt: null,
}

/** Saqlangan sozlamalarni standart qiymatlar bilan birlashtirib qaytaradi. */
export async function getSettings(): Promise<AppSettings> {
  const rows = await db.settings.toArray()
  const stored: Record<string, unknown> = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  const settings = { ...DEFAULT_SETTINGS, ...stored } as AppSettings

  // Buzilgan yoki eskirgan qiymatlardan himoya
  if (!LANGUAGES.includes(settings.language)) settings.language = DEFAULT_SETTINGS.language
  if (!THEME_MODES.includes(settings.theme)) settings.theme = DEFAULT_SETTINGS.theme
  if (!EXCUSED_MODES.includes(settings.excusedMode)) settings.excusedMode = DEFAULT_SETTINGS.excusedMode
  return settings
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  const now = Date.now()
  const rows = Object.entries(patch)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({ key, value, updated_at: now }))
  if (rows.length > 0) await db.settings.bulkPut(rows)
}
