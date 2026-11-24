import { useEffect, useState } from 'react'
import { toLocalDate } from '@/lib/date'

/** Bugungi sana (qurilmaning mahalliy sanasi). Ilova yarim tundan keyin ham ochiq tursa, sana o'zi yangilanadi. */
export function useToday(): string {
  const [today, setToday] = useState(() => toLocalDate())

  useEffect(() => {
    const refresh = () => setToday(toLocalDate())
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return today
}
