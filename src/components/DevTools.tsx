import { useState } from 'react'
import { clearAllData } from '@/db'
import { seedDemoData } from '@/db/devSeed'
import { useT } from '@/i18n'
import { Button } from '@/components/ui/button'
import { DatabaseIcon, TrashIcon } from '@/components/icons'

/** FAQAT dev rejimida ko'rinadi: demo ma'lumot qo'shish va tozalash. */
export function DevTools() {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.035] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <DatabaseIcon className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t('dev.title')}</h2>
          <p className="text-xs text-muted-foreground">Sinov ma'lumotlarini boshqarish</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button disabled={busy} onClick={() => void run(seedDemoData)} className="w-full">
          <DatabaseIcon className="size-4" />
          {busy ? 'Kutilmoqda…' : t('dev.seed')}
        </Button>
        <Button
          variant="destructive-outline"
          disabled={busy}
          onClick={() => {
            if (window.confirm(t('dev.clearConfirm'))) void run(clearAllData)
          }}
          className="w-full hover:bg-destructive hover:text-destructive-foreground"
        >
          <TrashIcon className="size-4" />
          {t('dev.clear')}
        </Button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    </section>
  )
}
