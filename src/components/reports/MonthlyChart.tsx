import type { MonthlyRate } from '@/db'
import { useT } from '@/i18n'
import { formatRate, monthShort } from '@/lib/format'

/** Oylar bo'yicha davomat foizi (oxirgi 12 oy): ustun balandligi — foiz. */
export function MonthlyChart({ months }: { months: MonthlyRate[] }) {
  const t = useT()

  return (
    <div className="flex gap-1.5" role="img" aria-label={t('studentReport.monthlyTitle')}>
      {months.slice(-12).map(({ month, rate }) => (
        <div key={month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-xs font-medium">{formatRate(rate)}</span>
          <div className="flex h-24 w-full items-end overflow-hidden rounded-sm bg-muted">
            <div className="w-full bg-primary" style={{ height: `${rate ?? 0}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{monthShort(Number(month.slice(5, 7)), t)}</span>
        </div>
      ))}
    </div>
  )
}
