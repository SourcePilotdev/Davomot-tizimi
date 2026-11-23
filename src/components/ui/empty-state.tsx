import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  hint?: string
  /** Ixtiyoriy amal (masalan, tugma yoki havola) */
  children?: ReactNode
}

export function EmptyState({ title, hint, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
