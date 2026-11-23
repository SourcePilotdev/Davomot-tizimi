import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  MAX_BACKUP_CHARS,
  backupFilename,
  countBackup,
  createBackup,
  getDataCounts,
  getSettings,
  listAttendanceRows,
  markBackupSaved,
  parseBackup,
  restoreBackup,
  serializeBackup,
  type BackupCounts,
  type BackupFile,
  type ExcusedMode,
  type Language,
  type ThemeMode,
} from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/i18n'
import { toCsv } from '@/lib/csv'
import { toLocalDate, toLocalTime } from '@/lib/date'
import { canShareFiles, downloadFile, shareFile } from '@/lib/download'
import { errorMessage } from '@/lib/errors'
import { formatLessonDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface Message {
  kind: 'success' | 'error'
  text: string
  /** Xato qaysi joyda (zaxira faylini tekshirishda) */
  detail?: string
}

interface PendingRestore {
  backup: BackupFile
  /** Hozirgi ma'lumotlar soni: tasdiq oynasida nima o'chishini ko'rsatish uchun */
  current: BackupCounts
}

/** Sozlamalar: zaxira nusxasi (olish, ulashish, tiklash), CSV eksport, foiz hisoblash qoidasi, til va mavzu. */
export function SettingsPage() {
  const t = useT()
  const today = useToday()
  const settings = useLiveQuery(() => getSettings())
  const language = useAppStore((state) => state.language)
  const theme = useAppStore((state) => state.theme)
  const excusedMode = useAppStore((state) => state.excusedMode)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const setTheme = useAppStore((state) => state.setTheme)
  const setExcusedMode = useAppStore((state) => state.setExcusedMode)
  const refreshSettings = useAppStore((state) => state.refreshSettings)

  const [message, setMessage] = useState<Message | null>(null)
  const [pending, setPending] = useState<PendingRestore | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const canShare = useMemo(() => canShareFiles(), [])

  const formatMoment = (ms: number) => {
    const moment = new Date(ms)
    return `${formatLessonDate(toLocalDate(moment), today, t)}, ${toLocalTime(moment)}`
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      setMessage({ kind: 'error', text: errorMessage(t, error) })
    } finally {
      setBusy(false)
    }
  }

  const downloadBackup = () =>
    run(async () => {
      const backup = await createBackup()
      downloadFile(backupFilename(backup.createdAt), serializeBackup(backup), 'application/json')
      await markBackupSaved(backup.createdAt)
      setMessage({ kind: 'success', text: t('settings.backupDone') })
    })

  const shareBackup = () =>
    run(async () => {
      const backup = await createBackup()
      const shared = await shareFile(backupFilename(backup.createdAt), serializeBackup(backup), 'application/json')
      if (!shared) return
      await markBackupSaved(backup.createdAt)
      setMessage({ kind: 'success', text: t('settings.backupDone') })
    })

  const downloadCsv = () =>
    run(async () => {
      const rows = await listAttendanceRows()
      const table = [
        [
          t('reports.csv.date'),
          t('reports.csv.time'),
          t('reports.csv.group'),
          t('reports.csv.topic'),
          t('reports.csv.student'),
          t('reports.csv.status'),
          t('reports.csv.lateMinutes'),
        ],
        ...rows.map((row) => [row.date, row.time, row.group, row.topic, row.student, t(`status.${row.status}`), row.lateMinutes || '']),
      ]
      downloadFile(`davomat-jadval-${toLocalDate()}.csv`, toCsv(table), 'text/csv')
    })

  /** Tanlangan faylni o'qiydi va tekshiradi. Yaroqli bo'lsa, tiklashdan oldin tasdiq so'raydi. */
  async function handleFile(file: File) {
    setMessage(null)
    if (file.size > MAX_BACKUP_CHARS) {
      setMessage({ kind: 'error', text: t('backup.errors.too_large') })
      return
    }
    let text: string
    try {
      text = await file.text()
    } catch {
      setMessage({ kind: 'error', text: t('backup.errors.read_failed') })
      return
    }
    const result = parseBackup(text)
    if (!result.ok) {
      setMessage({ kind: 'error', text: t(`backup.errors.${result.code}`), detail: result.detail })
      return
    }
    setPending({ backup: result.backup, current: await getDataCounts() })
  }

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'uz', label: "O'zbekcha" },
    { value: 'tg', label: 'Тоҷикӣ' },
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
  ]
  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ]
  const excusedOptions: { value: ExcusedMode; label: string }[] = [
    { value: 'absent', label: t('settings.excusedAbsent') },
    { value: 'ignore', label: t('settings.excusedIgnore') },
  ]

  const lastBackupAt = settings?.lastBackupAt ?? null
  const pendingCounts = pending ? countBackup(pending.backup) : null

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">{t('settings.title')}</h1>

      {message && (
        <div role={message.kind === 'error' ? 'alert' : 'status'} className={cn('space-y-1 rounded-lg border p-3 text-sm', message.kind === 'error' && 'border-destructive')}>
          <p className={message.kind === 'error' ? 'font-medium text-destructive' : 'font-medium'}>{message.text}</p>
          {message.detail && <p className="break-words text-muted-foreground">{t('backup.where', { detail: message.detail })}</p>}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('settings.backupTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('settings.backupInfo')}</p>
        {settings !== undefined && (
          <p className="text-sm font-medium">
            {lastBackupAt === null ? t('settings.neverBackedUp') : t('settings.lastBackup', { when: formatMoment(lastBackupAt) })}
          </p>
        )}
        <div className="space-y-2">
          <Button className="w-full" onClick={downloadBackup} disabled={busy}>
            {t('settings.backupDownload')}
          </Button>
          {canShare && (
            <Button variant="outline" className="w-full" onClick={shareBackup} disabled={busy}>
              {t('settings.backupShare')}
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => fileInput.current?.click()} disabled={busy}>
            {t('settings.backupRestore')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label={t('settings.backupRestore')}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = '' // bir xil faylni qayta tanlash mumkin bo'lishi uchun
              if (file) void handleFile(file)
            }}
          />
        </div>
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-semibold">{t('settings.csvTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('settings.csvInfo')}</p>
        <Button variant="outline" className="w-full" onClick={downloadCsv} disabled={busy}>
          {t('settings.csvDownload')}
        </Button>
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-semibold">{t('settings.rulesTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('settings.rulesInfo')}</p>
        <SegmentedControl
          label={t('settings.rulesTitle')}
          value={excusedMode}
          onChange={(mode) => void setExcusedMode(mode)}
          options={excusedOptions}
        />
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-semibold">{t('settings.appearanceTitle')}</h2>
        <div className="space-y-1.5">
          <span className="block text-sm font-medium">{t('settings.language')}</span>
          <SegmentedControl label={t('settings.language')} value={language} onChange={(value) => void setLanguage(value)} options={languageOptions} />
        </div>
        <div className="space-y-1.5">
          <span className="block text-sm font-medium">{t('settings.theme')}</span>
          <SegmentedControl label={t('settings.theme')} value={theme} onChange={(value) => void setTheme(value)} options={themeOptions} />
        </div>
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={t('settings.restoreTitle')}
        message={
          pending && pendingCounts
            ? t('settings.restoreMessage', {
                date: formatMoment(pending.backup.createdAt),
                groups: pendingCounts.groups,
                students: pendingCounts.students,
                lessons: pendingCounts.lessons,
                records: pendingCounts.attendance,
              })
            : ''
        }
        details={
          pending
            ? t('settings.restoreDetails', {
                groups: pending.current.groups,
                students: pending.current.students,
                lessons: pending.current.lessons,
                records: pending.current.attendance,
              })
            : undefined
        }
        confirmLabel={t('settings.restoreConfirm')}
        onConfirm={async () => {
          if (!pending) return
          await restoreBackup(pending.backup)
          await refreshSettings()
          const restored = countBackup(pending.backup)
          setPending(null)
          setMessage({
            kind: 'success',
            text: t('settings.restoreDone', {
              groups: restored.groups,
              students: restored.students,
              lessons: restored.lessons,
              records: restored.attendance,
            }),
          })
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
