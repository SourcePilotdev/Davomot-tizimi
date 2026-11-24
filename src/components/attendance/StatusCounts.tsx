import { ATTENDANCE_STATUSES, type AttendanceCounts } from '@/db'
import { useT } from '@/i18n'
import { STATUS_STYLES } from '@/lib/status'
import { cn } from '@/lib/utils'

/**
 * Holatlar bo'yicha soni: rangli nuqta + son (nol bo'lganlari ko'rsatilmaydi).
 * Rang davomat holatini bildiradi, ekran o'qish dasturlari uchun esa holat nomi matn sifatida bor.
 */
export function StatusCounts({ counts }: { counts: AttendanceCounts }) {
  const t = useT()
  const visible = ATTENDANCE_STATUSES.filter((status) => counts[status] > 0)
  if (visible.length === 0) return null

  return (
    <span className="inline-flex items-center gap-3">
      {visible.map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className={cn('size-2.5 rounded-full', STATUS_STYLES[status].dot)} aria-hidden="true" />
          <span className="text-sm font-medium">
            <span className="sr-only">{t(`status.${status}`)}: </span>
            {counts[status]}
          </span>
        </span>
      ))}
    </span>
  )
}
