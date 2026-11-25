import { ChevronRightIcon } from '@/components/icons'
import { useT } from '@/i18n'
import type { Student } from '@/db'
import { cn } from '@/lib/utils'
import { VirtualList } from '@/components/ui/VirtualList'

interface StudentListProps {
  students: Student[]
  secondaryText: (student: Student) => string
  onSelect: (student: Student) => void
}

export function StudentList({ students, secondaryText, onSelect }: StudentListProps) {
  const t = useT()
  return (
    <VirtualList
      items={students}
      itemHeight={72}
      label={t('students.title')}
      getKey={(student) => student.id}
      className="divide-y overflow-hidden rounded-lg border bg-card"
      renderItem={(student) => {
        const inactive = student.status === 'inactive'
        const secondary = secondaryText(student)
        return (
          <button type="button" onClick={() => onSelect(student)} className="flex min-h-[72px] w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-accent">
            <span className="min-w-0">
              <span className={cn('block truncate font-medium', inactive && 'text-muted-foreground')}>{student.full_name}</span>
              {secondary && <span className="block truncate text-sm text-muted-foreground">{secondary}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              {inactive && <span>{t('status.inactive')}</span>}
              <ChevronRightIcon className="size-5" />
            </span>
          </button>
        )
      }}
    />
  )
}
