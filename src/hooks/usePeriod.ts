import { useMemo, useState } from 'react'
import { startOfMonth } from '@/lib/date'
import { resolveRange, type PeriodPreset } from '@/lib/period'

/** Hisobot davri holati: tayyor davr yoki "boshqa davr" (ikki sana) va undan hisoblangan sana oralig'i. */
export function usePeriod(today: string, initial: PeriodPreset = 'month') {
  const [preset, setPreset] = useState<PeriodPreset>(initial)
  const [custom, setCustom] = useState({ from: startOfMonth(today), to: today })
  const range = useMemo(() => resolveRange(preset, custom, today), [preset, custom, today])
  return { preset, setPreset, custom, setCustom, range }
}
