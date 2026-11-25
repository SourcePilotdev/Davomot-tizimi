import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon } from '@/components/icons'
import { StudentList } from '@/components/students/StudentList'
import { useStudentEditor } from '@/components/students/useStudentEditor'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/field'
import { SearchInput } from '@/components/ui/search-input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { filterStudents, listGroups, listStudents, type StudentStatus } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { useT } from '@/i18n'

type StatusFilter = 'all' | StudentStatus

/** Barcha o'quvchilar: qidiruv, guruh va holat bo'yicha filtr, qo'shish va tahrirlash. */
export function StudentsPage() {
  const t = useT()
  const groups = useLiveQuery(() => listGroups())
  const students = useLiveQuery(() => listStudents())

  const [search, setSearch] = useState('')
  const [groupId, setGroupId] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const editor = useStudentEditor(groups ?? [])

  const groupNames = useMemo(() => new Map((groups ?? []).map((group) => [group.id, group.name] as const)), [groups])
  const visible = useMemo(
    () =>
      filterStudents(students ?? [], {
        search,
        groupId: groupId || undefined,
        status: status === 'all' ? undefined : status,
      }),
    [students, search, groupId, status],
  )

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('students.all') },
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ]

  function renderBody() {
    if (groups === undefined || students === undefined) {
      return <p className="text-muted-foreground">{t('common.loading')}</p>
    }
    if (groups.length === 0) {
      return (
        <EmptyState title={t('students.noGroupsTitle')} hint={t('students.noGroupsHint')}>
          <Link to="/groups" className={buttonClass('primary')}>
            {t('students.goToGroups')}
          </Link>
        </EmptyState>
      )
    }
    if (students.length === 0) {
      return <EmptyState title={t('students.emptyTitle')} hint={t('students.emptyHint')} />
    }
    return (
      <>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('students.searchPlaceholder')}
          clearLabel={t('common.clear')}
        />
        <Select aria-label={t('students.filterGroup')} value={groupId} onChange={(event) => setGroupId(event.target.value)}>
          <option value="">{t('students.allGroups')}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
        <SegmentedControl label={t('students.filterStatus')} value={status} onChange={setStatus} options={statusOptions} />
        {visible.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{t('students.noResults')}</p>
        ) : (
          <StudentList
            students={visible}
            secondaryText={(student) => groupNames.get(student.group_id) ?? ''}
            onSelect={editor.openEdit}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('students.title')}</h1>
        {groups !== undefined && groups.length > 0 && (
          <Button size="sm" onClick={() => editor.openCreate()}>
            <PlusIcon className="size-5" />
            {t('students.add')}
          </Button>
        )}
      </div>
      {renderBody()}
      {editor.dialogs}
    </div>
  )
}
