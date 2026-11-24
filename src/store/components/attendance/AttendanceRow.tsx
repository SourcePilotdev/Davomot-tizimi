import { memo } from 'react'
import { ATTENDANCE_STATUSES, type AttendanceStatus } from '@/db'
import { useT } from '@/i18n'
import { STATUS_STYLES } from '@/lib/status'
import { cn } from '@/lib/utils'

interface AttendanceRowProps {
  id: string
  name: string
  inactive: boolean
  status: AttendanceStatus | null
  lateMinutes: number
  onMark: (id: string, status: AttendanceStatus) => void
}

/**
 * Bitta o'quvchi qatori: ism + to'rtta holat tugmasi. Faqat tanlangan holat rangli, qolgani betaraf:
 * ekran tinch turadi, belgilangan va belgilanmagan o'quvchilar bir qarashda ajralib turadi.
 *
 * Props faqat oddiy qiymatlar (primitivlar): memo shu tufayli bir o'quvchi belgilanganda qolgan
 * qatorlar qayta chizilmaydi. Uzun ro'yxatda arzon telefonlar uchun muhim.
 */
export const AttendanceRow = memo(function AttendanceRow({ id, name, inactive, status, lateMinutes, onMark }: AttendanceRowProps) {
  const t = useT()
  const meta = [status === 'late' ? t('attendance.minutes', { count: lateMinutes }) : '', inactive ? t('status.inactive') : '']
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-2 border-b px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{name}</span>
        {meta && <span className="shrink-0 text-sm text-muted-foreground">{meta}</span>}
      </div>
      <div role="group" aria-label={name} className="grid grid-cols-4 gap-1.5">
        {ATTENDANCE_STATUSES.map((option) => {
          const selected = status === option
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onMark(id, option)}
              className={cn(
                'min-h-12 rounded-lg border px-1 text-sm font-medium leading-tight',
                selected ? STATUS_STYLES[option].selected : 'border-input bg-card text-muted-foreground active:bg-accent',
              )}
            >
              {t(`status.${option}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
})
