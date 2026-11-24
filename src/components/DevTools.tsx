import { useState } from 'react'
import { clearAllData } from '@/db'
import { seedDemoData } from '@/db/devSeed'
import { useT } from '@/i18n'

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
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-dashed border-violet-400/50 bg-gradient-to-br from-violet-500/[0.10] via-fuchsia-500/[0.06] to-cyan-500/[0.08] p-4 shadow-sm sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-fuchsia-400/15 blur-2xl" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-violet-500/15 text-xl">🧪</span>
          <div>
            <h2 className="font-semibold tracking-tight">{t('dev.title')}</h2>
            <p className="text-xs text-muted-foreground">Developer playground</p>
          </div>
          <span className="ml-auto rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">DEV</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => void run(seedDemoData)} className="group flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] disabled:opacity-50">
            <span className="text-lg transition-transform group-hover:rotate-12">🗂️</span>
            {busy ? '...' : t('dev.seed')}
            <span aria-hidden="true" className="text-lg">✦</span>
          </button>
          <button type="button" disabled={busy} onClick={() => { if (window.confirm(t('dev.clearConfirm'))) void run(clearAllData) }} className="group flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-rose-500/35 bg-rose-500/[0.08] px-4 font-semibold text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-500/70 hover:bg-rose-500/15 active:scale-[0.98] dark:text-rose-300 disabled:opacity-50">
            <span className="text-lg transition-transform group-hover:rotate-[-12deg]">🗑️</span>
            {busy ? '...' : t('dev.clear')}
            <span aria-hidden="true" className="text-lg">⚠️</span>
          </button>
        </div>
        {error && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">⚠️ {error}</p>}
      </div>
    </section>
  )
}
