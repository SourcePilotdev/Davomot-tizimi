import { create } from 'zustand'
import { getSettings, initDatabase, updateSettings, type ExcusedMode, type Language, type ThemeMode } from '@/db'
import { applyTheme } from '@/lib/theme'

export type DbStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AppState {
  dbStatus: DbStatus
  dbError: string | null
  /** Brauzer doimiy xotira (navigator.storage.persist) bergan yoki bermaganini ko'rsatadi */
  storagePersisted: boolean
  /** Qurilma soati orqaga surilgan bo'lsa — ilova oxirgi marta ochilgan vaqt (UTC ms), aks holda null */
  clockIssueSince: number | null
  language: Language
  theme: ThemeMode
  /** "Sababli" kelmagan darslar davomat foiziga qanday ta'sir qiladi */
  excusedMode: ExcusedMode

  /** Bazani ochadi va sozlamalarni yuklaydi. Qayta chaqirish xavfsiz (bir marta bajariladi). */
  init: () => Promise<void>
  setLanguage: (language: Language) => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setExcusedMode: (mode: ExcusedMode) => Promise<void>
  /** Sozlamalarni bazadan qayta o'qiydi (masalan, zaxiradan tiklagandan keyin) */
  refreshSettings: () => Promise<void>
}

// React.StrictMode dev rejimida effektni ikki marta ishga tushiradi — init bir marta ishlashi uchun.
let initPromise: Promise<void> | null = null

export const useAppStore = create<AppState>()((set) => ({
  dbStatus: 'idle',
  dbError: null,
  storagePersisted: false,
  clockIssueSince: null,
  language: 'uz',
  theme: 'system',
  excusedMode: 'absent',

  init: () => {
    initPromise ??= (async () => {
      set({ dbStatus: 'loading', dbError: null })
      try {
        const { persisted, clockIssueSince } = await initDatabase()
        const settings = await getSettings()
        document.documentElement.lang = settings.language
        applyTheme(settings.theme)
        set({
          dbStatus: 'ready',
          storagePersisted: persisted,
          clockIssueSince,
          language: settings.language,
          theme: settings.theme,
          excusedMode: settings.excusedMode,
        })
      } catch (error) {
        console.error("Ma'lumotlar bazasini ochishda xato:", error)
        initPromise = null // "Qayta urinish" tugmasi yana bajarishi uchun
        set({ dbStatus: 'error', dbError: error instanceof Error ? error.message : String(error) })
      }
    })()
    return initPromise
  },

  setLanguage: async (language) => {
    set({ language })
    document.documentElement.lang = language
    await updateSettings({ language })
  },

  setTheme: async (theme) => {
    set({ theme })
    applyTheme(theme)
    await updateSettings({ theme })
  },

  setExcusedMode: async (excusedMode) => {
    set({ excusedMode })
    await updateSettings({ excusedMode })
  },

  refreshSettings: async () => {
    const settings = await getSettings()
    document.documentElement.lang = settings.language
    applyTheme(settings.theme)
    set({ language: settings.language, theme: settings.theme, excusedMode: settings.excusedMode })
  },
}))
