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

const STAT_STYLE = [
  { emoji: '👥', shell: 'from-cyan-500/15 to-blue-500/10', icon: 'bg-gradient-to-br from-cyan-400 to-blue-500', number: 'text-cyan-600 dark:text-cyan-300' },
  { emoji: '🎓', shell: 'from-amber-500/15 to-orange-500/10', icon: 'bg-gradient-to-br from-amber-400 to-orange-500', number: 'text-amber-600 dark:text-amber-300' },
  { emoji: '📚', shell: 'from-violet-500/15 to-fuchsia-500/10', icon: 'bg-gradient-to-br from-violet-500 to-fuchsia-500', number: 'text-violet-600 dark:text-violet-300' },
  { emoji: '📊', shell: 'from-emerald-500/15 to-teal-500/10', icon: 'bg-gradient-to-br from-emerald-400 to-teal-500', number: 'text-emerald-600 dark:text-emerald-300' },
]

export function HomePage() {
  const t = useT()
  const today = useToday()
  const mode = useAppStore((state) => state.excusedMode)
  const persisted = useAppStore((state) => state.storagePersisted)
  const dashboard = useLiveQuery(() => getDashboard(today, mode), [today, mode])
  const counts = useLiveQuery(async () => ({ groups: await db.groups.count(), students: await db.students.count(), lessons: await db.lessons.count(), attendance: await db.attendance.count() }))

  const rows: { label: TranslationKey; value: number | undefined }[] = [
    { label: 'entities.groups', value: counts?.groups },
    { label: 'entities.students', value: counts?.students },
    { label: 'entities.lessons', value: counts?.lessons },
    { label: 'entities.attendance', value: counts?.attendance },
  ]

  function renderDashboard() {
    if (dashboard === undefined) return null
    if (dashboard.groups === 0) {
      return <EmptyState title={t('home.onboardingTitle')} hint={t('home.onboardingHint')}>
        <Link to="/groups" className={buttonClass('primary')}>👥 {t('home.goGroups')} <span aria-hidden="true">→</span></Link>
      </EmptyState>
    }

    const monthMarks = Object.values(dashboard.monthCounts).reduce((sum, n) => sum + n, 0)
    return <>
      <section className="relative isolate overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-xl shadow-violet-600/20 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 size-44 rounded-full border-[22px] border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-20 size-40 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">✦ {t('home.monthTitle')}</p>
            <p className="mt-3 text-sm font-medium text-white/75">{t('home.monthRate')}</p>
            <p className="mt-0.5 text-5xl font-black tracking-tight">{formatRate(dashboard.monthRate)}</p>
          </div>
          <span className="grid size-14 place-items-center rounded-[1.25rem] border border-white/20 bg-white/15 text-3xl shadow-inner backdrop-blur-sm">🚀</span>
        </div>
        <div className="relative mt-5 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-white/80">
            <span>📅 {t('home.monthLessons', { count: dashboard.monthLessons })}</span>
            <span>{monthMarks} {t('entities.attendance').toLowerCase()}</span>
          </div>
          <AttendanceBar counts={dashboard.monthCounts} className="h-3.5 bg-white/20 [&>div]:rounded-full" />
          <div className="mt-3 text-white"><StatusCounts counts={dashboard.monthCounts} /></div>
          {monthMarks === 0 && <p className="mt-2 text-xs text-white/70">{t('home.monthEmpty')}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-500">TODAY ✦</p><h2 className="text-lg font-extrabold tracking-tight">{t('home.todayTitle')}</h2></div>
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">{dashboard.today.length} 📌</span>
        </div>
        {dashboard.today.length > 0 ? <ul className="divide-y divide-border/60 overflow-hidden rounded-[1.4rem] border border-border/70 bg-card/85 shadow-sm">{dashboard.today.map((summary) => <LessonRow key={summary.lesson.id} summary={summary} today={today} />)}</ul> :
          <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-dashed border-cyan-500/40 bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.08] p-4">
            <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/15 text-xl">🗓️</span><p className="text-sm text-muted-foreground">{t('home.todayEmpty')}</p></div>
            <Link to="/attendance" className={buttonClass('primary', 'sm', 'shrink-0')}>⚡ {t('home.goAttendance')}</Link>
          </div>}
      </section>

      {dashboard.attention.length > 0 && <section className="space-y-3">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-rose-500/12 text-xl">🧡</span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-500">NEEDS A BOOST</p><h2 className="text-lg font-extrabold tracking-tight">{t('home.attentionTitle')}</h2></div></div>
        <p className="text-sm text-muted-foreground">{t('home.attentionHint', { rate: ATTENTION_RATE, marks: ATTENTION_MIN_MARKS })}</p>
        <ul className="divide-y divide-border/60 overflow-hidden rounded-[1.4rem] border border-border/70 bg-card/85 shadow-sm">{dashboard.attention.map((stats) => <StudentRateRow key={stats.student.id} stats={stats} secondary={stats.groupName} />)}</ul>
      </section>}
    </>
  }

  return <div className="space-y-7">
    <div className="flex items-end justify-between gap-3">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-violet-500">YOUR CONTROL CENTER ✨</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{t('nav.home')}</h1><p className="mt-1 text-sm text-muted-foreground">Make every lesson count.</p></div>
      <span className="grid size-12 shrink-0 place-items-center rounded-[1.2rem] bg-gradient-to-br from-amber-300 to-orange-500 text-2xl shadow-lg shadow-orange-500/20">🌈</span>
    </div>

    <section className="grid grid-cols-2 gap-3">
      {rows.map((row, index) => {
        const style = STAT_STYLE[index]
        return <div key={row.label} className={`group relative isolate overflow-hidden rounded-[1.5rem] border border-white/50 bg-gradient-to-br ${style.shell} p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/[0.06]`}>
          <div aria-hidden="true" className="absolute -right-4 -top-5 size-20 rounded-full bg-white/35 blur-xl dark:bg-white/[0.04]" />
          <div className="relative flex items-center justify-between gap-2"><span className={`grid size-10 place-items-center rounded-2xl ${style.icon} text-xl text-white shadow-md`}>{style.emoji}</span><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">0{index + 1}</span></div>
          <p className="relative mt-4 text-xs font-semibold text-muted-foreground">{t(row.label)}</p>
          <p className={`relative mt-0.5 text-3xl font-black tracking-tight ${style.number}`}>{row.value ?? '–'}</p>
        </div>
      })}
    </section>

    {renderDashboard()}

    <section className="space-y-3 rounded-[1.6rem] border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-500/12 text-xl">🛡️</span><div><h2 className="font-bold">{t('home.dbReady')}</h2><p className="text-xs text-muted-foreground">{persisted ? '☁️' : '💾'} {persisted ? t('home.storagePersistent') : t('home.storageBestEffort')}</p></div><span className="ml-auto size-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" /></div>
      <dl aria-label={t('home.counts')} className="grid grid-cols-2 gap-2">
        {rows.map((row, index) => <div key={row.label} className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2.5"><dt className="text-xs text-muted-foreground">{t(row.label)}</dt><dd className="font-extrabold">{row.value ?? '–'}</dd></div>)}
      </dl>
    </section>

    {import.meta.env.DEV && <DevTools />}
  </div>
}
