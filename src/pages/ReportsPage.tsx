import { useMemo, useState } from 'react'
import { LessonRow } from '@/components/attendance/LessonRow'
import { StatusCounts } from '@/components/attendance/StatusCounts'
import { AttendanceBar } from '@/components/reports/AttendanceBar'
import { LessonTrend } from '@/components/reports/LessonTrend'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { StudentRateRow } from '@/components/reports/StudentRateRow'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { getAttendanceReport, listGroups, missedCount, type StudentStats } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { usePeriod } from '@/hooks/usePeriod'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/i18n'
import { toCsv } from '@/lib/csv'
import { toLocalDate } from '@/lib/date'
import { downloadFile } from '@/lib/download'
import { formatDay, formatRate } from '@/lib/format'
import { compareText } from '@/lib/text'
import { useAppStore } from '@/store/useAppStore'

type SortKey = 'name' | 'rate' | 'missed'
const HISTORY_PAGE = 15

/**
 * Hisobot: tanlangan guruh va davr bo'yicha umumiy foiz, darslar dinamikasi, eng ko'p dars qoldirganlar,
 * o'quvchilar ro'yxati va darslar tarixi. CSV yuklab olish va PDF (chop etish oynasi orqali) mumkin.
 */
export function ReportsPage() {
  const t = useT()
  const today = useToday()
  const mode = useAppStore((state) => state.excusedMode)
  const groups = useLiveQuery(() => listGroups())

  const [groupId, setGroupId] = useState('')
  const period = usePeriod(today)
  const { from, to } = period.range
  const [sort, setSort] = useState<SortKey>('name')
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE)

  const report = useLiveQuery(
    () => getAttendanceReport({ groupId: groupId || undefined, from, to }, mode),
    [groupId, from, to, mode],
  )

  const students = useMemo<StudentStats[]>(() => {
    const list = [...(report?.students ?? [])]
    const byName = (a: StudentStats, b: StudentStats) => compareText(a.student.full_name, b.student.full_name)
    if (sort === 'rate') {
      // Eng past foiz birinchi; foizi hisoblanmaganlar oxirida
      list.sort((a, b) => Number(a.rate === null) - Number(b.rate === null) || (a.rate ?? 0) - (b.rate ?? 0) || byName(a, b))
    } else if (sort === 'missed') {
      list.sort((a, b) => missedCount(b.counts, mode) - missedCount(a.counts, mode) || byName(a, b))
    }
    return list
  }, [report, sort, mode])

  // Reyting: eng ko'p dars qoldirganlar (kamida bitta qoldirgan), 5 tagacha
  const ranking = useMemo(
    () =>
      (report?.students ?? [])
        .map((stats) => ({ stats, missed: missedCount(stats.counts, mode) }))
        .filter((entry) => entry.missed > 0)
        .sort(
          (a, b) =>
            b.missed - a.missed ||
            (a.stats.rate ?? 0) - (b.stats.rate ?? 0) ||
            compareText(a.stats.student.full_name, b.stats.student.full_name),
        )
        .slice(0, 5),
    [report, mode],
  )

  const groupName = groups?.find((group) => group.id === groupId)?.name ?? t('reports.allGroups')
  const periodText =
    from || to
      ? `${t(`reports.periods.${period.preset}`)}: ${from ? formatDay(from, today, t) : '…'} – ${to ? formatDay(to, today, t) : '…'}`
      : t(`reports.periods.${period.preset}`)

  function exportCsv() {
    const rows = [
      [
        t('reports.csv.student'),
        t('reports.csv.group'),
        t('reports.csv.marked'),
        t('status.present'),
        t('status.absent'),
        t('status.late'),
        t('status.excused'),
        t('reports.csv.lateMinutes'),
        t('reports.csv.rate'),
      ],
      ...students.map((s) => [
        s.student.full_name,
        s.groupName,
        s.marked,
        s.counts.present,
        s.counts.absent,
        s.counts.late,
        s.counts.excused,
        s.lateMinutes,
        s.rate === null ? '' : Math.round(s.rate),
      ]),
    ]
    downloadFile(`davomat-hisobot-${toLocalDate()}.csv`, toCsv(rows), 'text/csv')
  }

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'name', label: t('reports.sortName') },
    { value: 'rate', label: t('reports.sortRate') },
    { value: 'missed', label: t('reports.sortMissed') },
  ]

  function renderBody() {
    if (report === undefined) return <p className="text-muted-foreground">{t('common.loading')}</p>
    if (report.summary.marks === 0) {
      return <EmptyState title={t('reports.noData')} hint={t('reports.noDataHint')} />
    }

    const { summary } = report
    const maxMissed = ranking[0]?.missed ?? 1

    return (
      <>
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('reports.summaryRate')}</p>
              <p className="text-4xl font-semibold">{formatRate(summary.rate)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{t('reports.lessonsCount', { count: summary.lessons })}</p>
              <p>{t('reports.marksCount', { count: summary.marks })}</p>
            </div>
          </div>
          <AttendanceBar counts={summary.counts} className="h-3" />
          <StatusCounts counts={summary.counts} />
        </section>

        {report.lessons.filter((l) => l.marked > 0).length >= 2 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">{t('reports.trendTitle')}</h2>
            <LessonTrend lessons={report.lessons} today={today} />
          </section>
        )}

        {ranking.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">{t('reports.rankingTitle')}</h2>
            <ol className="divide-y overflow-hidden rounded-lg border bg-card">
              {ranking.map(({ stats, missed }) => (
                <li key={stats.student.id} className="space-y-1.5 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-medium">{stats.student.full_name}</span>
                    <span className="shrink-0 font-semibold">{t('reports.missedCount', { count: missed })}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(missed / maxMissed) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{t('reports.studentsTitle')}</h2>
          <div className="print:hidden">
            <SegmentedControl label={t('reports.sortLabel')} value={sort} onChange={setSort} options={sortOptions} />
          </div>
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {students.map((stats) => (
              <StudentRateRow
                key={stats.student.id}
                stats={stats}
                secondary={[groupId ? '' : stats.groupName, stats.marked > 0 ? t('reports.marksShort', { count: stats.marked }) : t('reports.noMarks')]
                  .filter(Boolean)
                  .join(', ')}
              />
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{t('reports.historyTitle')}</h2>
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {report.lessons.slice(0, historyLimit).map((summary) => (
              <LessonRow key={summary.lesson.id} summary={summary} today={today} />
            ))}
          </ul>
          {report.lessons.length > historyLimit && (
            <Button variant="outline" className="w-full print:hidden" onClick={() => setHistoryLimit((n) => n + HISTORY_PAGE)}>
              {t('reports.showMore')}
            </Button>
          )}
        </section>

        <section className="space-y-2 print:hidden">
          <h2 className="text-sm font-medium text-muted-foreground">{t('reports.exportTitle')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={exportCsv}>
              {t('reports.exportCsv')}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              {t('reports.exportPdf')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t('reports.pdfHint')}</p>
        </section>
      </>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t('reports.title')}</h1>

      <div className="print:hidden">
        <ReportFilters
          groups={groups ?? []}
          groupId={groupId}
          onGroupChange={setGroupId}
          preset={period.preset}
          onPresetChange={period.setPreset}
          custom={period.custom}
          onCustomChange={period.setCustom}
        />
      </div>

      {/* Qog'ozda tanlovlar o'rniga matn: qaysi guruh, qaysi davr, qachon tayyorlangan */}
      <div className="hidden space-y-0.5 text-sm print:block">
        <p className="font-medium">{groupName}</p>
        <p>{periodText}</p>
        <p className="text-muted-foreground">{t('reports.printedAt', { date: formatDay(today, today, t) })}</p>
      </div>

      {renderBody()}
    </div>
  )
}
