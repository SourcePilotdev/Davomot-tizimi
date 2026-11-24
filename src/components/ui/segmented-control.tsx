import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  /** Ekran o'qish dasturlari uchun guruh nomi */
  label: string
}

/** 2–3 ta variantdan birini tanlash (filtr, holat). Hammasi bir qarashda ko'rinadi, bitta bosish bilan almashadi. */
export function SegmentedControl<T extends string>({ value, onChange, options, label }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-11 flex-1 rounded-md border px-3 text-sm font-medium',
              selected ? 'border-border bg-card text-foreground' : 'border-transparent text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
