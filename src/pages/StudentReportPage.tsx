import { Link, useParams } from 'react-router-dom'
import { StatusCounts } from '@/components/attendance/StatusCounts'
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from '@/components/icons'
import { AttendanceBar } from '@/components/reports/AttendanceBar'
import { MonthlyChart } from '@/components/reports/MonthlyChart'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { useStudentEditor } from '@/components/students/useStudentEditor'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { getStudentReport, listGroups } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { usePeriod } from '@/hooks/usePeriod'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/i18n'
import { formatLessonDate, formatRate } from '@/lib/format'
import { STATUS_STYLES } from '@/lib/status'
import { formatPhone } from '@/lib/text'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

/** Bitta o'quvchi: davomat foizi (umumiy yoki tanlangan davr bo'yicha), oylar bo'yicha grafik va belgilar tarixi. */
export function StudentReportPage() {
  const t = useT()
  const today = useToday()
  const mode = useAppStore((state) => state.excusedMode)
  const { studentId = '' } = useParams<{ studentId: string }>()

  const groups = useLiveQuery(() => listGroups())
  const period = usePeriod(today, 'all')
  const { from, to } = period.range
  // { report: null } — o'quvchi topilmadi; undefined — hali yuklanmoqda
  const result = useLiveQuery(async () => ({ report: await getStudentReport(studentId, { from, to }, mode) }), [studentId, from, to, mode])
  const editor = useStudentEditor(groups ?? [])

  if (result === undefined) return <p className="text-muted-foreground">{t('common.loading')}</p>

  const report = result.report
  if (report === null) {
    return (
      <EmptyState title={t('studentReport.notFound')} hint={t('studentReport.notFoundHint')}>
        <Link to="/reports" className={buttonClass('outline')}>
          {t('studentReport.back')}
        </Link>
      </EmptyState>
    )
  }

  const { student } = report
  const phones = [
    { label: t('studentReport.phone'), value: student.phone },
    { label: t('studentReport.parentPhone'), value: student.parent_phone },
  ].filter((phone) => phone.value !== '')

  return (
    <div className="space-y-5">
      <Link to="/reports" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeftIcon className="size-5" />
        {t('studentReport.back')}
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-xl font-semibold">{student.full_name}</h1>
          <p className="text-sm text-muted-foreground">{report.groupName}</p>
          {phones.map((phone) => (
            <p key={phone.label} className="text-sm">
              <span className="text-muted-foreground">{phone.label}: </span>
              <a href={`tel:${phone.value}`} className="underline underline-offset-2">
                {formatPhone(phone.value)}
              </a>
            </p>
          ))}
        </div>
        <Button variant="outline" size="icon" aria-label={t('studentReport.edit')} onClick={() => editor.openEdit(student)}>
          <EditIcon className="size-5" />
        </Button>
      </div>

      <ReportFilters
        preset={period.preset}
        onPresetChange={period.setPreset}
        custom={period.custom}
        onCustomChange={period.setCustom}
      />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('reports.summaryRate')}</p>
            <p className="text-4xl font-semibold">{formatRate(report.rate)}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{t('reports.marksCount', { count: report.marked })}</p>
            {report.lateMinutes > 0 && <p>{t('studentReport.lateTotal', { count: report.lateMinutes })}</p>}
          </div>
        </div>
        <AttendanceBar counts={report.counts} className="h-3" />
        <StatusCounts counts={report.counts} />
      </section>

      {report.months.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{t('studentReport.monthlyTitle')}</h2>
          <MonthlyChart months={report.months} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t('studentReport.historyTitle')}</h2>
        {report.history.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">{t('studentReport.noHistory')}</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {report.history.map(({ lesson, mark }) => (
              <li key={lesson.id}>
                <Link
                  to={`/attendance/${lesson.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 active:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{`${formatLessonDate(lesson.date, today, t)}, ${lesson.start_time}`}</span>
                    {lesson.topic && <span className="block truncate text-sm text-muted-foreground">{lesson.topic}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm">
                    <span className={cn('size-2.5 rounded-full', STATUS_STYLES[mark.status].dot)} aria-hidden="true" />
                    <span>
                      {t(`status.${mark.status}`)}
                      {mark.status === 'late' ? `, ${t('attendance.minutes', { count: mark.late_minutes })}` : ''}
                    </span>
                    <ChevronRightIcon className="size-5 text-muted-foreground" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editor.dialogs}
    </div>
  )
}
