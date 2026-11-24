import { Link } from 'react-router-dom'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { getSettings } from '@/db'
import { useT } from '@/i18n'

const DAY = 24 * 60 * 60 * 1000

/** Eslatma faqat lokal backup sanasiga qaraydi; internet talab qilmaydi. */
export function BackupReminder() {
  const t = useT()
  const settings = useLiveQuery(() => getSettings())
  if (!settings) return null
  const reminderBaseAt = settings.lastBackupAt ?? settings.firstUsedAt
  // Ilova ilk marta ochilganidan (yoki oxirgi zaxiradan) belgilangan kunlar o'tgach eslatadi.
  const due = reminderBaseAt !== null && Date.now() - reminderBaseAt >= settings.backupReminderDays * DAY
  if (!due) return null
  return (
    <div role="status" className="mx-4 mt-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      <p className="font-semibold">{t('backupReminder.title')}</p>
      <p className="mt-1 text-muted-foreground">{t('backupReminder.message', { days: settings.backupReminderDays })}</p>
      <Link to="/settings" className="mt-2 inline-flex min-h-10 items-center font-semibold underline underline-offset-4">{t('backupReminder.action')}</Link>
    </div>
  )
}
