import type { TFunction, TranslationKey } from '@/i18n'
import { addDays } from '@/lib/date'

const MONTH_KEYS = [
  'calendar.months.m1',
  'calendar.months.m2',
  'calendar.months.m3',
  'calendar.months.m4',
  'calendar.months.m5',
  'calendar.months.m6',
  'calendar.months.m7',
  'calendar.months.m8',
  'calendar.months.m9',
  'calendar.months.m10',
  'calendar.months.m11',
  'calendar.months.m12',
] as const satisfies readonly TranslationKey[]

/** "2026-11-14" → "14-noyabr" (joriy yildan boshqa yil bo'lsa: "14-noyabr 2025"). */
export function formatDay(date: string, today: string, t: TFunction): string {
  const [year, month, day] = date.split('-').map(Number)
  const params = { day, month: t(MONTH_KEYS[month - 1]), year }
  return year === Number(today.slice(0, 4)) ? t('calendar.dateShort', params) : t('calendar.dateWithYear', params)
}

/** Ro'yxatlar uchun: "Bugun", "Kecha", boshqa kunlar — "14-noyabr". */
export function formatLessonDate(date: string, today: string, t: TFunction): string {
  if (date === today) return t('attendance.today')
  if (date === addDays(today, -1)) return t('attendance.yesterday')
  return formatDay(date, today, t)
}

/** Oyning qisqa nomi (grafik ostidagi yozuv uchun): 11 → "noy". */
export function monthShort(month: number, t: TFunction): string {
  return t(MONTH_KEYS[month - 1]).slice(0, 3)
}

/** 66.7 → "67%"; hisoblash uchun ma'lumot bo'lmasa — "–". */
export function formatRate(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate)}%`
}
