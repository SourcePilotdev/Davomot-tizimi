import { CloseIcon, SearchIcon } from '@/components/icons'
import { inputClass } from '@/components/ui/field'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  clearLabel: string
}

export function SearchInput({ value, onChange, placeholder, clearLabel }: SearchInputProps) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, 'pl-10 pr-12 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={clearLabel}
          className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground"
        >
          <CloseIcon className="size-5" />
        </button>
      )}
    </div>
  )
}
