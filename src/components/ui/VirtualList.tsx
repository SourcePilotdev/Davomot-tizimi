import { useMemo, useState, type ReactNode } from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  /** Oddiy ro'yxat kichik to'plamlar uchun; virtual rejim katta ro'yxat uchun. */
  threshold?: number
  label?: string
  getKey?: (item: T) => string
}

/** Fixed-height virtual list. DOM'da faqat ko'rinadigan qatorlar va kichik overscan turadi. */
export function VirtualList<T>({ items, itemHeight, renderItem, className = '', threshold = 50, label, getKey }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(560)
  const virtual = items.length > threshold
  const range = useMemo(() => {
    if (!virtual) return { start: 0, end: items.length }
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 4)
    const end = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + 4)
    return { start, end }
  }, [virtual, items.length, scrollTop, viewportHeight, itemHeight])

  if (!virtual) return <ul className={className}>{items.map((item, index) => <li key={getKey?.(item) ?? index}>{renderItem(item, index)}</li>)}</ul>

  return (
    <div
      className="max-h-[70dvh] overflow-y-auto overscroll-contain rounded-lg border bg-card"
      role="list"
      aria-label={label}
      onScroll={(event) => { setScrollTop(event.currentTarget.scrollTop); setViewportHeight(event.currentTarget.clientHeight) }}
      style={{ height: '70dvh' }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <ul className={className} style={{ position: 'absolute', top: range.start * itemHeight, left: 0, right: 0 }}>
          {items.slice(range.start, range.end).map((item, offset) => (
            <li key={getKey?.(item) ?? range.start + offset} style={{ height: itemHeight, overflow: 'hidden' }}>{renderItem(item, range.start + offset)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
