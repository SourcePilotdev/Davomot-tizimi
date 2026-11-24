import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GroupFormDialog } from '@/components/groups/GroupFormDialog'
import { ChevronLeftIcon, EditIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { StudentList } from '@/components/students/StudentList'
import { useStudentEditor } from '@/components/students/useStudentEditor'
import { Button, buttonClass } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { SearchInput } from '@/components/ui/search-input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  deleteGroup,
  filterStudents,
  getGroup,
  getGroupImpact,
  listGroups,
  listStudents,
  startLesson,
  type GroupImpact,
  type StudentStatus,
} from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { useT } from '@/i18n'
import { errorMessage } from '@/lib/errors'
import { formatPhone } from '@/lib/text'

type StatusFilter = 'all' | StudentStatus

/** Bitta guruh: nomi, o'quvchilari (qidiruv va holat filtri bilan), tahrirlash va o'chirish. */
export function GroupDetailPage() {
  const t = useT()
  const navigate = useNavigate()
  const { groupId = '' } = useParams<{ groupId: string }>()

  // { group: null } — guruh topilmadi; undefined — hali yuklanmoqda
  const groupResult = useLiveQuery(async () => ({ group: (await getGroup(groupId)) ?? null }), [groupId])
  const students = useLiveQuery(() => listStudents({ groupId }), [groupId])
  const groups = useLiveQuery(() => listGroups())

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteImpact, setDeleteImpact] = useState<GroupImpact | null>(null)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const editor = useStudentEditor(groups ?? [])

  const visible = useMemo(
    () => filterStudents(students ?? [], { search, status: status === 'all' ? undefined : status }),
    [students, search, status],
  )

  if (groupResult === undefined || students === undefined) {
    return <p className="text-muted-foreground">{t('common.loading')}</p>
  }

  const group = groupResult.group
  if (!group) {
    return (
      <EmptyState title={t('groups.notFound')} hint={t('groups.notFoundHint')}>
        <Link to="/groups" className={buttonClass('outline')}>
          {t('groups.back')}
        </Link>
      </EmptyState>
    )
  }

  const inactiveCount = students.filter((student) => student.status === 'inactive').length
  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('students.all') },
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ]

  const requestDelete = async () => setDeleteImpact(await getGroupImpact(group.id))
  // Bugungi dars bor bo'lsa — o'shani ochadi, yo'q bo'lsa yangisini yaratadi
  const startLessonHere = async () => {
    setStarting(true)
    setStartError(null)
    try {
      const lesson = await startLesson(group.id)
      navigate(`/attendance/${lesson.id}`)
    } catch (e) {
      setStartError(errorMessage(t, e))
      setStarting(false)
    }
  }
  const confirmDelete = async () => {
    await deleteGroup(group.id)
    navigate('/groups', { replace: true })
  }

  return (
    <div className="space-y-4">
      <Link to="/groups" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeftIcon className="size-5" />
        {t('groups.back')}
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t('groups.studentCount', { count: students.length })}
            {inactiveCount > 0 && `, ${t('groups.inactiveCount', { count: inactiveCount })}`}
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label={t('groups.edit')} onClick={() => setEditOpen(true)}>
          <EditIcon className="size-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => editor.openCreate(group.id)}>
          <PlusIcon className="size-5" />
          {t('students.add')}
        </Button>
        <Button onClick={startLessonHere} disabled={starting}>
          {t('attendance.startLesson')}
        </Button>
      </div>
      {startError && (
        <p role="alert" className="text-sm text-destructive">
          {startError}
        </p>
      )}

      {students.length === 0 ? (
        <EmptyState title={t('students.emptyTitle')} hint={t('students.emptyHint')} />
      ) : (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('students.searchPlaceholder')}
            clearLabel={t('common.clear')}
          />
          <SegmentedControl label={t('students.filterStatus')} value={status} onChange={setStatus} options={statusOptions} />
          {visible.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t('students.noResults')}</p>
          ) : (
            <StudentList
              students={visible}
              secondaryText={(student) => formatPhone(student.phone || student.parent_phone)}
              onSelect={editor.openEdit}
            />
          )}
        </>
      )}

      <div className="border-t pt-4">
        <Button variant="destructive-outline" className="w-full" onClick={requestDelete}>
          <TrashIcon className="size-5" />
          {t('groups.delete')}
        </Button>
      </div>

      <GroupFormDialog open={editOpen} onClose={() => setEditOpen(false)} group={group} />
      <ConfirmDialog
        open={deleteImpact !== null}
        title={t('groups.deleteTitle')}
        message={t('groups.deleteMessage', { name: group.name })}
        details={
          deleteImpact
            ? t('groups.deleteImpact', {
                students: deleteImpact.students,
                lessons: deleteImpact.lessons,
                records: deleteImpact.attendance,
              })
            : undefined
        }
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteImpact(null)}
      />
      {editor.dialogs}
    </div>
  )
}
