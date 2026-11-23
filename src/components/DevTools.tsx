import { useState } from 'react'
import { clearAllData } from '@/db'
import { seedDemoData } from '@/db/devSeed'
import { useT } from '@/i18n'

/** FAQAT dev rejimida ko'rinadi (HomePage dagi `import.meta.env.DEV`): demo ma'lumot qo'shish va tozalash. */
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

  const buttonClass = 'min-h-12 flex-1 rounded-lg border px-3 text-sm font-medium disabled:opacity-50'

  return (
    <section className="space-y-3 rounded-lg border border-dashed p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t('dev.title')}</h2>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => void run(seedDemoData)} className={buttonClass}>
          {t('dev.seed')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm(t('dev.clearConfirm'))) void run(clearAllData)
          }}
          className={`${buttonClass} text-destructive`}
        >
          {t('dev.clear')}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
