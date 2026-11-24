import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AttendanceRow } from '@/components/attendance/AttendanceRow'
import { VirtualList } from '@/components/ui/VirtualList'
import { LateMinutesDialog } from '@/components/attendance/LateMinutesDialog'
import { LessonFormDialog } from '@/components/attendance/LessonFormDialog'
import { StatusCounts } from '@/components/attendance/StatusCounts'
import { ChevronLeftIcon, EditIcon, TrashIcon } from '@/components/icons'
import { Button, buttonClass } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  clearAttendance,
  countStatuses,
  deleteLesson,
  getLessonImpact,
  getLessonSheet,
  listGroups,
  saveLessonAttendance,
  setAttendance,
  type AttendanceMark,
  type AttendanceStatus,
} from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/i18n'
import { errorMessage } from '@/lib/errors'
import { formatDay, formatLessonDate } from '@/lib/format'

const sameMark = (a: AttendanceMark | null, b: AttendanceMark | null): boolean =>
  a === null || b === null ? a === b : a.status === b.status && a.late_minutes === b.late_minutes

/**
 * Davomat belgilash ekrani (asosiy funksiya). Har bir bosish DARHOL saqlanadi — "Saqlash" tugmasi yo'q,
 * internet kerak emas. Ekran bazadan javobni kutmaydi: bosilgan belgi darhol ko'rinadi (optimistik),
 * baza yangilanishi unga yetib kelgach vaqtinchalik belgi olib tashlanadi. Xato bo'lsa, belgi
 * qaytariladi va xabar chiqadi.
 */
export function LessonPage() {
  const t = useT()
  const navigate = useNavigate()
  const today = useToday()
  const { lessonId = '' } = useParams<{ lessonId: string }>()

  // { sheet: null } — dars topilmadi; undefined — hali yuklanmoqda
  const result = useLiveQuery(async () => ({ sheet: await getLessonSheet(lessonId) }), [lessonId])
  const groups = useLiveQuery(() => listGroups())
  const sheet = result?.sheet ?? null

  // Hali bazaga yetib bormagan belgilar: o'quvchi ID → belgi (null — belgi olib tashlangan)
  const [pending, setPending] = useState(() => new Map<string, AttendanceMark | null>())
  const [lateTarget, setLateTarget] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteRecords, setDeleteRecords] = useState<number | null>(null)

  const recordMarks = useMemo(
    () =>
      new Map(
        (sheet?.records ?? []).map((record) => [record.student_id, { status: record.status, late_minutes: record.late_minutes }] as const),
      ),
    [sheet?.records],
  )
  const marks = useMemo(() => {
    const merged = new Map<string, AttendanceMark | null>(recordMarks)
    pending.forEach((mark, id) => merged.set(id, mark))
    return merged
  }, [recordMarks, pending])

  // Tugma ishlovchilari barqaror bo'lib turishi uchun (qatorlar memo) — joriy qiymatlar ref orqali o'qiladi
  const marksRef = useRef(marks)
  const studentsRef = useRef(sheet?.students)
  useEffect(() => {
    marksRef.current = marks
    studentsRef.current = sheet?.students
  })

  // Baza vaqtinchalik belgiga yetib kelsa, vaqtinchalik belgi kerak emas
  useEffect(() => {
    setPending((prev) => {
      if (prev.size === 0) return prev
      const next = new Map(prev)
      prev.forEach((mark, id) => {
        if (sameMark(recordMarks.get(id) ?? null, mark)) next.delete(id)
      })
      return next.size === prev.size ? prev : next
    })
  }, [recordMarks])

  const apply = useCallback(
    (id: string, mark: AttendanceMark | null) => {
      setError(null)
      setPending((prev) => new Map(prev).set(id, mark))
      const write = mark
        ? setAttendance(lessonId, { student_id: id, status: mark.status, late_minutes: mark.late_minutes })
        : clearAttendance(lessonId, id)
      write.catch((e: unknown) => {
        setError(errorMessage(t, e))
        setPending((prev) => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
      })
    },
    [lessonId, t],
  )

  const handleMark = useCallback(
    (id: string, status: AttendanceStatus) => {
      if (status === 'late') {
        const name = studentsRef.current?.find((student) => student.id === id)?.full_name ?? ''
        setLateTarget({ id, name })
        return
      }
      const current = marksRef.current.get(id) ?? null
      // Tanlangan holatni qayta bosish — belgini olib tashlaydi
      apply(id, current?.status === status ? null : { status, late_minutes: 0 })
    },
    [apply],
  )

  if (result === undefined) return <p className="text-muted-foreground">{t('common.loading')}</p>
  if (sheet === null) {
    return (
      <EmptyState title={t('attendance.notFound')} hint={t('attendance.notFoundHint')}>
        <Link to="/attendance" className={buttonClass('outline')}>
          {t('attendance.back')}
        </Link>
      </EmptyState>
    )
  }

  const { lesson, group } = sheet
  const roster = sheet.students
  const currentMarks = roster.map((student) => marks.get(student.id)).filter((mark): mark is AttendanceMark => mark != null)
  const counts = countStatuses(currentMarks)
  const unmarked = roster.length - currentMarks.length

  const lateMark = lateTarget ? (marks.get(lateTarget.id) ?? null) : null
  const currentLate = lateMark?.status === 'late' ? lateMark.late_minutes : null

  const markAllPresent = () => {
    const ids = roster.filter((student) => !marks.get(student.id)).map((student) => student.id)
    if (ids.length === 0) return
    const present: AttendanceMark = { status: 'present', late_minutes: 0 }
    setError(null)
    setPending((prev) => {
      const next = new Map(prev)
      ids.forEach((id) => next.set(id, present))
      return next
    })
    saveLessonAttendance(
      lessonId,
      ids.map((id) => ({ student_id: id, status: 'present' as const })),
    ).catch((e: unknown) => {
      setError(errorMessage(t, e))
      setPending((prev) => {
        const next = new Map(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
    })
  }

  const requestDelete = async () => setDeleteRecords((await getLessonImpact(lesson.id)).attendance)
  const confirmDelete = async () => {
    await deleteLesson(lesson.id)
    navigate('/attendance', { replace: true })
  }

  return (
    <div className="space-y-4">
      <Link to="/attendance" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeftIcon className="size-5" />
        {t('attendance.back')}
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{group?.name ?? ''}</h1>
          <p className="text-sm text-muted-foreground">{`${formatLessonDate(lesson.date, today, t)}, ${lesson.start_time}`}</p>
          {lesson.topic && <p className="mt-1">{lesson.topic}</p>}
        </div>
        <Button variant="outline" size="icon" aria-label={t('attendance.editLesson')} onClick={() => setEditOpen(true)}>
          <EditIcon className="size-5" />
        </Button>
      </div>

      {roster.length === 0 ? (
        <EmptyState title={t('attendance.noStudentsTitle')} hint={t('attendance.noStudentsHint')}>
          <Link to={`/groups/${lesson.group_id}`} className={buttonClass('primary')}>
            {t('attendance.goToGroup')}
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* Ro'yxat aylantirilganda ham hisob va "Hammasi keldi" tugmasi ko'rinib turadi */}
          <div className="sticky top-14 z-[5] -mx-4 border-b bg-background px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <StatusCounts counts={counts} />
                {unmarked > 0 && (
                  <span className="text-sm text-muted-foreground">{t('attendance.unmarkedCount', { count: unmarked })}</span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={markAllPresent} disabled={unmarked === 0}>
                {t('attendance.allPresent')}
              </Button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <VirtualList
            items={roster}
            itemHeight={116}
            label={t('attendance.title')}
            getKey={(student) => student.id}
            className="divide-y overflow-hidden rounded-lg border bg-card"
            renderItem={(student) => {
              const mark = marks.get(student.id)
              return <AttendanceRow id={student.id} name={student.full_name} inactive={student.status === 'inactive'} status={mark?.status ?? null} lateMinutes={mark?.late_minutes ?? 0} onMark={handleMark} />
            }}
          />
        </>
      )}

      <div className="border-t pt-4">
        <Button variant="destructive-outline" className="w-full" onClick={requestDelete}>
          <TrashIcon className="size-5" />
          {t('attendance.deleteLesson')}
        </Button>
      </div>

      <LateMinutesDialog
        open={lateTarget !== null}
        studentName={lateTarget?.name ?? ''}
        current={currentLate}
        onSelect={(minutes) => {
          if (lateTarget) apply(lateTarget.id, { status: 'late', late_minutes: minutes })
          setLateTarget(null)
        }}
        onClear={() => {
          if (lateTarget) apply(lateTarget.id, null)
          setLateTarget(null)
        }}
        onClose={() => setLateTarget(null)}
      />
      <LessonFormDialog open={editOpen} onClose={() => setEditOpen(false)} groups={groups ?? []} lesson={lesson} />
      <ConfirmDialog
        open={deleteRecords !== null}
        title={t('lessons.deleteTitle')}
        message={t('lessons.deleteMessage', { group: group?.name ?? '', date: formatDay(lesson.date, today, t) })}
        details={
          deleteRecords !== null && deleteRecords > 0
            ? t('lessons.deleteImpact', { records: deleteRecords })
            : t('lessons.deleteNoRecords')
        }
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRecords(null)}
      />
    </div>
  )
}
