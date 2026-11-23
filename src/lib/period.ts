import { addDays, startOfMonth } from './date'

export const PERIOD_PRESETS = ['month', 'week', 'days30', 'all', 'custom'] as const
export type PeriodPreset = (typeof PERIOD_PRESETS)[number]

/** Sana oralig'i, ikkala chegara ham kiradi. Chegara berilmasa — cheklanmagan. */
export interface DateRange {
  from?: string
  to?: string
}

/** Tayyor davrlar: shu oy (1-kundan bugungacha), oxirgi 7 va 30 kun (bugun ham kiradi), hammasi. */
export function presetRange(preset: Exclude<PeriodPreset, 'custom'>, today: string): DateRange {
  switch (preset) {
    case 'month':
      return { from: startOfMonth(today), to: today }
    case 'week':
      return { from: addDays(today, -6), to: today }
    case 'days30':
      return { from: addDays(today, -29), to: today }
    case 'all':
      return {}
  }
}

/** Tanlangan davrni sana oralig'iga aylantiradi. Sanalar chalkash kiritilsa (dan > gacha), almashtirib qo'yadi. */
export function resolveRange(preset: PeriodPreset, custom: { from: string; to: string }, today: string): DateRange {
  if (preset !== 'custom') return presetRange(preset, today)
  const { from, to } = custom
  if (from && to && from > to) return { from: to, to: from }
  return { from: from || undefined, to: to || undefined }
}
