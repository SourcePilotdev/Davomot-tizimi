import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

/**
 * Dexie so'rovini kuzatadi: ma'lumot o'zgarganda (shu yoki boshqa oyna/tabdan ham)
 * komponent o'zi qayta chiziladi. Ma'lumot kelguncha `undefined` qaytaradi.
 *
 * `dexie-react-hooks` paketidagi `useLiveQuery` bilan bir xil imzoga ega, shuning uchun
 * xohlasangiz o'sha paketga almashtirish mumkin — faqat import o'zgaradi.
 */
export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: readonly unknown[] = [],
): T | undefined {
  const [result, setResult] = useState<T | undefined>(undefined)

  // `querier` har renderda yangi funksiya bo'ladi; qayta obuna faqat `deps` o'zgarganda kerak.
  useEffect(() => {
    const subscription = liveQuery(querier).subscribe({
      next: (value) => setResult(() => value),
      error: (error) => console.error('liveQuery xatosi:', error),
    })
    return () => subscription.unsubscribe()
  }, deps)

  return result
}
