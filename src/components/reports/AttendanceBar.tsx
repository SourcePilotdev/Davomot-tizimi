import { ATTENDANCE_STATUSES, type AttendanceCounts } from '@/db'
import { STATUS_STYLES } from '@/lib/status'
import { cn } from '@/lib/utils'

/**
 * Holatlar ulushini ko'rsatuvchi tor chiziq (keldi / kelmadi / kech keldi / sababli).
 * Bu faqat ko'rinish uchun: aniq sonlar yonida matn bilan beriladi.
 */
export function AttendanceBar({ counts, className }: { counts: AttendanceCounts; className?: string }) {
  const total = ATTENDANCE_STATUSES.reduce((sum, status) => sum + counts[status], 0)
  return (
    <div className={cn('flex h-2 overflow-hidden rounded-full bg-muted', className)} aria-hidden="true">
      {total > 0 &&
        ATTENDANCE_STATUSES.map((status) =>
          counts[status] > 0 ? (
            <div key={status} className={STATUS_STYLES[status].dot} style={{ width: `${(counts[status] / total) * 100}%` }} />
          ) : null,
        )}
    </div>
  )
}
