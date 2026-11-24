import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LessonFormDialog } from '@/components/attendance/LessonFormDialog'
import { LessonRow } from '@/components/attendance/LessonRow'
import { PlusIcon } from '@/components/icons'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { listGroups, listLessonSummaries, startLesson } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/i18n'
import { toLocalDate, toLocalTime } from '@/lib/date'
import { errorMessage } from '@/lib/errors'
import { useAppStore } from '@/store/useAppStore'

/**
 * Davomat bosh ekrani. "Bugun" bo'limida har bir guruh uchun bitta bosishda dars boshlanadi
 * (bugungi dars allaqachon bor bo'lsa, o'sha ochiladi). Boshqa sana/vaqt uchun "Yangi dars" formasi.
 */
export function AttendancePage() {
  const t = useT()
  const navigate = useNavigate()
  const today = useToday()
  const clockIssueSince = useAppStore((state) => state.clockIssueSince)

  const groups = useLiveQuery(() => listGroups())
  const todays = useLiveQuery(() => listLessonSummaries({ from: today, to: today }), [today])
  const recent = useLiveQuery(() => listLessonSummaries({ limit: 30 }), [])

  const [formOpen, setFormOpen] = useState(false)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function start(groupId: string) {
    if (startingId !== null) return
    setStartingId(groupId)
    setError(null)
    try {
      const lesson = await startLesson(groupId)
      navigate(`/attendance/${lesson.id}`)
    } catch (e) {
      setError(errorMessage(t, e))
      setStartingId(null)
    }
  }

  const others = (recent ?? []).filter((summary) => summary.lesson.date !== today).slice(0, 20)

  function renderToday() {
    if (groups === undefined || todays === undefined) {
      return <p className="text-muted-foreground">{t('common.loading')}</p>
    }
    if (groups.length === 0) {
      return (
        <EmptyState title={t('attendance.noGroupsTitle')} hint={t('attendance.noGroupsHint')}>
          <Link to="/groups" className={buttonClass('primary')}>
            {t('attendance.goToGroups')}
          </Link>
        </EmptyState>
      )
    }
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t('attendance.today')}</h2>
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {groups.map((group) => {
            const lessons = todays
              .filter((summary) => summary.lesson.group_id === group.id)
              .sort((a, b) => a.lesson.start_time.localeCompare(b.lesson.start_time))
            if (lessons.length > 0) {
              return lessons.map((summary) => <LessonRow key={summary.lesson.id} summary={summary} today={today} />)
            }
            return (
              <li key={group.id} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate font-medium">{group.name}</span>
                <Button size="sm" onClick={() => start(group.id)} disabled={startingId !== null}>
                  {t('attendance.start')}
                </Button>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('attendance.title')}</h1>
        {groups !== undefined && groups.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <PlusIcon className="size-5" />
            {t('attendance.newLesson')}
          </Button>
        )}
      </div>

      {clockIssueSince !== null && (
        <div role="alert" className="space-y-1 rounded-lg border border-destructive p-3 text-sm">
          <p className="font-medium">{t('attendance.clockTitle')}</p>
          <p className="text-muted-foreground">
            {t('attendance.clockMessage', {
              lastSeen: `${toLocalDate(new Date(clockIssueSince))} ${toLocalTime(new Date(clockIssueSince))}`,
            })}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {renderToday()}

      {others.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{t('attendance.recentTitle')}</h2>
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {others.map((summary) => (
              <LessonRow key={summary.lesson.id} summary={summary} today={today} />
            ))}
          </ul>
        </section>
      )}

      <LessonFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        groups={groups ?? []}
        defaultGroupId={recent?.[0]?.lesson.group_id}
        onCreated={(lesson) => navigate(`/attendance/${lesson.id}`)}
      />
    </div>
  )
}
