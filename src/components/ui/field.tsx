import { useId, type ComponentProps, type ReactNode } from 'react'
import { ChevronDownIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Kiritish maydonlari uchun umumiy sinflar. 16px (text-base): iPhone'da fokusda sahifa kattalashib ketmaydi. */
export const inputClass =
  'h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground disabled:opacity-50'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputClass, className)} {...props} />
}

/** Brauzerning o'zidagi <select>: telefonda tizimning qulay tanlash oynasini ochadi. */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(inputClass, 'appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

interface FieldControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

interface FieldProps {
  label: string
  error?: string | null
  hint?: string
  /** Maydonning o'zini chizadi; `control` ni uning ustiga yoyib yuboring: <Input {...control} /> */
  children: (control: FieldControlProps) => ReactNode
}

/** Sarlavha + maydon + xato/maslahat matni. Sarlavha maydon bilan bog'langan (aria). */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
