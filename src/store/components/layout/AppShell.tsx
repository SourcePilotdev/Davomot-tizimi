import type { ComponentType } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  AttendanceIcon,
  GroupsIcon,
  HomeIcon,
  ReportsIcon,
  SettingsIcon,
  StudentsIcon,
} from '@/components/icons'
import { useT, type TranslationKey } from '@/i18n'
import { cn } from '@/lib/utils'
import { BackupReminder } from '@/components/BackupReminder'

const NAV_ITEMS: {
  to: string
  label: TranslationKey
  icon: ComponentType<{ className?: string }>
  end?: boolean
}[] = [
  { to: '/', label: 'nav.home', icon: HomeIcon, end: true },
  { to: '/groups', label: 'nav.groups', icon: GroupsIcon },
  { to: '/students', label: 'nav.students', icon: StudentsIcon },
  { to: '/attendance', label: 'nav.attendance', icon: AttendanceIcon },
  { to: '/reports', label: 'nav.reports', icon: ReportsIcon },
]

/**
 * Umumiy ramka: tepada sarlavha, pastda bosh barmoq yetadigan navigatsiya.
 * Soya va xiralashtirish (blur) ataylab ishlatilmagan — arzon Android telefonlarda sekinlashtiradi.
 */
export function AppShell() {
  const t = useT()

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col print:max-w-none">
      <header className="sticky top-0 z-10 border-b bg-background print:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-lg font-semibold">{t('app.name')}</span>
          <Link
            to="/settings"
            aria-label={t('nav.settings')}
            className="-mr-3 flex size-12 items-center justify-center rounded-lg text-muted-foreground active:bg-accent"
          >
            <SettingsIcon className="size-6" />
          </Link>
        </div>
      </header>

      <BackupReminder />
      <main className="flex-1 px-4 py-5 pb-28 print:p-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-[env(safe-area-inset-bottom)] print:hidden">
        <ul className="mx-auto flex max-w-2xl">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 border-t-2 text-xs',
                    isActive
                      ? 'border-primary font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground',
                  )
                }
              >
                <Icon className="size-6" />
                <span>{t(label)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
