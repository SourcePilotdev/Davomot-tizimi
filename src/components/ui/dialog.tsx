import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  /** Esc, orqa fon bosilganda yoki dialog boshqa yo'l bilan yopilganda chaqiriladi */
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Brauzerning o'zidagi <dialog> asosida modal oyna: fokusni ichida ushlab turadi, Esc bilan yopiladi,
 * orqadagi sahifa bosilmaydi. Qo'shimcha kutubxona kerak emas. Telefonda pastdan chiqadigan
 * "bottom sheet", kengroq ekranlarda markazda turadi.
 *
 * Ichidagi kontent (children) faqat oyna ochiq bo'lganda chiziladi, shuning uchun formalar
 * har safar toza holatdan boshlanadi.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const pressedBackdrop = useRef(false)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      // Telefonda klaviatura o'zi ochilib ketmasligi uchun: faqat data-autofocus belgilangan
      // element fokus oladi, aks holda fokus sarlavhaga qo'yiladi.
      const target = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? titleRef.current
      target?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // Faqat orqa fon (backdrop) bosilganda yopiladi. Matnni oyna ichidan tashqariga sudrab belgilash
      // tasodifan yopib yubormasligi uchun bosish ham, qo'yib yuborish ham orqa fonda bo'lishi kerak.
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) onClose()
        pressedBackdrop.current = false
      }}
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl border bg-card p-0 text-card-foreground backdrop:bg-[rgb(0_0_0/0.5)] sm:m-auto sm:max-w-md sm:rounded-2xl"
    >
      {open && (
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="mb-4 text-lg font-semibold focus:outline-none">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  )
}
