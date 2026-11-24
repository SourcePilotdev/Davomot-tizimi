import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GroupFormDialog } from '@/components/groups/GroupFormDialog'
import { ChevronRightIcon, PlusIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SearchInput } from '@/components/ui/search-input'
import { filterGroups, listGroupsWithStats } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { useT } from '@/i18n'

export function GroupsPage() {
  const t = useT()
  const groups = useLiveQuery(() => listGroupsWithStats())
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const visible = useMemo(() => (groups ? filterGroups(groups, search) : []), [groups, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('groups.title')}</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <PlusIcon className="size-5" />
          {t('groups.add')}
        </Button>
      </div>

      {groups === undefined ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : groups.length === 0 ? (
        <EmptyState title={t('groups.emptyTitle')} hint={t('groups.emptyHint')} />
      ) : (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('groups.searchPlaceholder')}
            clearLabel={t('common.clear')}
          />
          {visible.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t('groups.noResults')}</p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {visible.map((group) => (
                <li key={group.id}>
                  <Link
                    to={`/groups/${group.id}`}
                    className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 active:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{group.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {t('groups.studentCount', { count: group.studentCount })}
                        {group.inactiveCount > 0 && `, ${t('groups.inactiveCount', { count: group.inactiveCount })}`}
                      </span>
                    </span>
                    <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <GroupFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
