import { Link } from 'react-router-dom'
import { StatusCounts } from '@/components/attendance/StatusCounts'
import { ChevronRightIcon } from '@/components/icons'
import type { LessonSummary } from '@/db'
import { useT } from '@/i18n'
import { formatLessonDate } from '@/lib/format'

interface LessonRowProps {
  summary: LessonSummary
  today: string
}

/** Darslar ro'yxatidagi qator: guruh nomi, sana/vaqt/mavzu va davomat hisobi (rangli nuqtalar). */
export function LessonRow({ summary, today }: LessonRowProps) {
  const t = useT()
  const { lesson, groupName, counts, marked } = summary
  const when = lesson.date === today ? lesson.start_time : `${formatLessonDate(lesson.date, today, t)}, ${lesson.start_time}`
  const secondary = lesson.topic ? `${when}, ${lesson.topic}` : when

  return (
    <li>
      <Link
        to={`/attendance/${lesson.id}`}
        className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 active:bg-accent"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{groupName}</span>
          <span className="block truncate text-sm text-muted-foreground">{secondary}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {marked > 0 ? (
            <StatusCounts counts={counts} />
          ) : (
            <span className="text-sm text-muted-foreground">{t('attendance.unmarkedShort')}</span>
          )}
          <ChevronRightIcon className="size-5 text-muted-foreground" />
        </span>
      </Link>
    </li>
  )
}
