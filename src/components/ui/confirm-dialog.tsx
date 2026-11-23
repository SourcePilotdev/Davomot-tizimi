import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useT } from '@/i18n'
import { errorMessage } from '@/lib/errors'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  /** Oqibatlar haqida qo'shimcha izoh (masalan, nimalar birga o'chadi) */
  details?: string
  confirmLabel: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

/**
 * Qaytarib bo'lmaydigan amallar (o'chirish) uchun tasdiq oynasi.
 * Fokus ehtiyotkor tugmada (Bekor qilish) boshlanadi.
 */
export function ConfirmDialog({ open, title, message, details, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <ConfirmBody message={message} details={details} confirmLabel={confirmLabel} onConfirm={onConfirm} onCancel={onCancel} />
    </Dialog>
  )
}

function ConfirmBody({ message, details, confirmLabel, onConfirm, onCancel }: Omit<ConfirmDialogProps, 'open' | 'title'>) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      // Muvaffaqiyatli bo'lsa, ota komponent oynani yopadi
    } catch (e) {
      setError(errorMessage(t, e))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p>{message}</p>
        {details && <p className="text-sm text-muted-foreground">{details}</p>}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onCancel} disabled={busy} data-autofocus="">
          {t('common.cancel')}
        </Button>
        <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
