import type { ThemeMode } from '@/db'

let stopWatchingSystem: (() => void) | null = null

/** Mavzuni <html> ga qo'llaydi: "dark" sinfi qo'shiladi/olib tashlanadi (index.css dagi .dark tokenlari). */
export function applyTheme(mode: ThemeMode): void {
  stopWatchingSystem?.()
  stopWatchingSystem = null

  const root = document.documentElement
  const setDark = (dark: boolean) => {
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
  }

  if (mode === 'system') {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setDark(event.matches)
    setDark(query.matches)
    query.addEventListener('change', onChange)
    stopWatchingSystem = () => query.removeEventListener('change', onChange)
  } else {
    setDark(mode === 'dark')
  }
}
