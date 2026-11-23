import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { failed: boolean }

/** Render xatolari butun ilovani oq ekranga tushirib qo'ymasligi uchun. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('UI xatosi:', error, info.componentStack) }
  render() {
    if (this.state.failed) return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Ilovada xatolik yuz berdi</h1>
        <p className="text-sm text-muted-foreground">Ma’lumotlaringiz lokal bazada saqlangan. Sahifani qayta yuklang.</p>
        <button className="min-h-12 rounded-lg bg-primary px-6 font-medium text-primary-foreground" onClick={() => window.location.reload()}>Qayta yuklash</button>
      </main>
    )
    return this.props.children
  }
}

