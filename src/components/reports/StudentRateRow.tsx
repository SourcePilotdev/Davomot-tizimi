import { Link } from 'react-router-dom'
import { AttendanceBar } from '@/components/reports/AttendanceBar'
import type { StudentStats } from '@/db'
import { formatRate } from '@/lib/format'

/** Ro'yxat qatori: o'quvchi ismi, ikkinchi qator (guruh va h.k.), davomat foizi va holatlar chizig'i. O'quvchi sahifasiga olib boradi. */
export function StudentRateRow({ stats, secondary }: { stats: StudentStats; secondary: string }) {
  const { student, counts, rate } = stats

  return (
    <li>
      <Link to={`/students/${student.id}`} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 active:bg-accent">
        <span className="min-w-0">
          <span className="block truncate font-medium">{student.full_name}</span>
          {secondary && <span className="block truncate text-sm text-muted-foreground">{secondary}</span>}
        </span>
        <span className="flex w-20 shrink-0 flex-col items-end gap-1.5">
          <span className="font-semibold">{formatRate(rate)}</span>
          <AttendanceBar counts={counts} className="w-full" />
        </span>
      </Link>
    </li>
  )
}
