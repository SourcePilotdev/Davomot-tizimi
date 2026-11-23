import { Link } from 'react-router-dom'
import { LessonRow } from '@/components/attendance/LessonRow'
import { StatusCounts } from '@/components/attendance/StatusCounts'
import { DevTools } from '@/components/DevTools'
import { AttendanceBar } from '@/components/reports/AttendanceBar'
import { StudentRateRow } from '@/components/reports/StudentRateRow'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ATTENTION_MIN_MARKS, ATTENTION_RATE, db, getDashboard } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { useToday } from '@/hooks/useToday'
import { useT, type TranslationKey } from '@/i18n'
import { formatRate } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

/**
 * Bosh sahifa: shu oy davomati, bugungi darslar va e'tibor talab qiladigan o'quvchilar.
 * Pastda — ma'lumotlar bazasi holati (diagnostika).
 */
export function HomePage() {
  const t = useT()
  const today = useToday()
  const mode = useAppStore((state) => state.excusedMode)
  const persisted = useAppStore((state) => state.storagePersisted)

  const dashboard = useLiveQuery(() => getDashboard(today, mode), [today, mode])
  const counts = useLiveQuery(async () => ({
    groups: await db.groups.count(),
    students: await db.students.count(),
    lessons: await db.lessons.count(),
    attendance: await db.attendance.count(),
  }))

  const rows: { label: TranslationKey; value: number | undefined }[] = [
    { label: 'entities.groups', value: counts?.groups },
    { label: 'entities.students', value: counts?.students },
    { label: 'entities.lessons', value: counts?.lessons },
    { label: 'entities.attendance', value: counts?.attendance },
  ]

  function renderDashboard() {
    if (dashboard === undefined) return null

    if (dashboard.groups === 0) {
      return (
        <EmptyState title={t('home.onboardingTitle')} hint={t('home.onboardingHint')}>
          <Link to="/groups" className={buttonClass('primary')}>
            {t('home.goGroups')}
          </Link>
        </EmptyState>
      )
    }

    const monthMarks = Object.values(dashboard.monthCounts).reduce((sum, n) => sum + n, 0)

    return (
      <>
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{t('home.monthTitle')}</h2>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('home.monthRate')}</p>
              <p className="text-4xl font-semibold">{formatRate(dashboard.monthRate)}</p>
            </div>
            <p className="text-sm text-muted-foreground">{t('home.monthLessons', { count: dashboard.monthLessons })}</p>
          </div>
          <AttendanceBar counts={dashboard.monthCounts} className="h-3" />
          {monthMarks > 0 ? (
            <StatusCounts counts={dashboard.monthCounts} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('home.monthEmpty')}</p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{t('home.todayTitle')}</h2>
          {dashboard.today.length > 0 ? (
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {dashboard.today.map((summary) => (
                <LessonRow key={summary.lesson.id} summary={summary} today={today} />
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <p className="min-w-0 text-sm text-muted-foreground">{t('home.todayEmpty')}</p>
              <Link to="/attendance" className={buttonClass('primary', 'sm', 'shrink-0')}>
                {t('home.goAttendance')}
              </Link>
            </div>
          )}
        </section>

        {dashboard.attention.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">{t('home.attentionTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('home.attentionHint', { rate: ATTENTION_RATE, marks: ATTENTION_MIN_MARKS })}
            </p>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {dashboard.attention.map((stats) => (
                <StudentRateRow key={stats.student.id} stats={stats} secondary={stats.groupName} />
              ))}
            </ul>
          </section>
        )}
      </>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">{t('nav.home')}</h1>

      {renderDashboard()}

      <section className="space-y-3 border-t pt-6">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">{t('home.dbReady')}</h2>
          <p className="text-sm text-muted-foreground">
            {persisted ? t('home.storagePersistent') : t('home.storageBestEffort')}
          </p>
        </div>
        <dl aria-label={t('home.counts')} className="divide-y rounded-lg border bg-card">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between px-4 py-3">
              <dt>{t(row.label)}</dt>
              <dd className="text-lg font-semibold">{row.value ?? '–'}</dd>
            </div>
          ))}
        </dl>
      </section>

      {import.meta.env.DEV && <DevTools />}
    </div>
  )
}
