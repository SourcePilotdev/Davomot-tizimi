import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/field'
import { MAX_LATE_MINUTES } from '@/db'
import { useT } from '@/i18n'
import { STATUS_STYLES } from '@/lib/status'
import { cn } from '@/lib/utils'

/** Eng ko'p uchraydigan kechikishlar: bitta bosish bilan tanlanadi va darhol saqlanadi. */
const QUICK_MINUTES = [5, 10, 15, 20, 30, 45]

interface LateMinutesDialogProps {
  open: boolean
  studentName: string
  /** O'quvchi allaqachon "kech keldi" deb belgilangan bo'lsa — joriy daqiqa */
  current: number | null
  onSelect: (minutes: number) => void
  /** Belgini olib tashlash (faqat joriy belgi bo'lganda ko'rsatiladi) */
  onClear: () => void
  onClose: () => void
}

export function LateMinutesDialog({ open, studentName, current, onSelect, onClear, onClose }: LateMinutesDialogProps) {
  const t = useT()
  return (
    <Dialog open={open} onClose={onClose} title={t('attendance.lateTitle')}>
      <LateMinutesForm studentName={studentName} current={current} onSelect={onSelect} onClear={onClear} onClose={onClose} />
    </Dialog>
  )
}

function LateMinutesForm({ studentName, current, onSelect, onClear, onClose }: Omit<LateMinutesDialogProps, 'open'>) {
  const t = useT()
  const [custom, setCustom] = useState(current !== null && !QUICK_MINUTES.includes(current) ? String(current) : '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const minutes = Number(custom)
    if (custom.trim() === '' || !Number.isInteger(minutes) || minutes < 1 || minutes > MAX_LATE_MINUTES) {
      setError(t('errors.late_minutes_invalid'))
      return
    }
    onSelect(minutes)
  }

  return (
    <div className="space-y-4">
      <p className="-mt-2 text-muted-foreground">{studentName}</p>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_MINUTES.map((minutes) => (
          <button
            key={minutes}
            type="button"
            aria-pressed={current === minutes}
            onClick={() => onSelect(minutes)}
            className={cn(
              'min-h-12 rounded-lg border text-base font-medium',
              current === minutes ? STATUS_STYLES.late.selected : 'border-input bg-card active:bg-accent',
            )}
          >
            {t('attendance.minutes', { count: minutes })}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_LATE_MINUTES}
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value)
              setError(null)
            }}
            placeholder={t('attendance.lateCustom')}
            aria-label={t('attendance.lateCustom')}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <Button type="submit">{t('common.save')}</Button>
      </form>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        {current !== null && (
          <Button variant="destructive-outline" className="flex-1" onClick={onClear}>
            {t('attendance.lateClear')}
          </Button>
        )}
      </div>
    </div>
  )
}
