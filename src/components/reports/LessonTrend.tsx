import { ATTENDANCE_STATUSES, type LessonSummary } from '@/db'
import { useT } from '@/i18n'
import { formatDay } from '@/lib/format'
import { STATUS_STYLES } from '@/lib/status'

/**
 * Oxirgi darslar bo'yicha davomat dinamikasi: har bir dars — bitta ustun, ichida holatlar ulushi
 * (pastdan yuqoriga: keldi, kelmadi, kech keldi, sababli). Hech qanday belgisi yo'q darslar chizilmaydi.
 */
export function LessonTrend({ lessons, today }: { lessons: LessonSummary[]; today: string }) {
  const t = useT()
  // `lessons` eng yangisi birinchi; grafik eskidan yangiga qarab chiziladi
  const shown = lessons.filter((summary) => summary.marked > 0).slice(0, 30).reverse()
  if (shown.length < 2) return null

  return (
    <div className="space-y-1">
      <div className="flex h-28 items-stretch gap-0.5" role="img" aria-label={t('reports.trendTitle')}>
        {shown.map(({ lesson, counts, marked }) => (
          <div
            key={lesson.id}
            title={`${formatDay(lesson.date, today, t)}, ${lesson.start_time}`}
            className="flex min-w-0 flex-1 flex-col-reverse overflow-hidden rounded-sm bg-muted"
          >
            {ATTENDANCE_STATUSES.map((status) =>
              counts[status] > 0 ? (
                <div key={status} className={STATUS_STYLES[status].dot} style={{ height: `${(counts[status] / marked) * 100}%` }} />
              ) : null,
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDay(shown[0].lesson.date, today, t)}</span>
        <span>{formatDay(shown[shown.length - 1].lesson.date, today, t)}</span>
      </div>
    </div>
  )
}
