import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PwaPrompt } from '@/components/PwaPrompt'
import { useT } from '@/i18n'
import { AttendancePage } from '@/pages/AttendancePage'
import { GroupDetailPage } from '@/pages/GroupDetailPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { HomePage } from '@/pages/HomePage'
import { LessonPage } from '@/pages/LessonPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StudentReportPage } from '@/pages/StudentReportPage'
import { StudentsPage } from '@/pages/StudentsPage'
import { useAppStore } from '@/store/useAppStore'

function Splash() {
  const t = useT()
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
      {t('startup.loading')}
    </div>
  )
}

function DbError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  const t = useT()
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">{t('startup.dbError')}</h1>
      <p className="text-sm text-muted-foreground">{t('startup.dbErrorHint')}</p>
      {message && <code className="max-w-full break-words rounded bg-muted px-2 py-1 text-xs">{message}</code>}
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 min-h-12 rounded-lg bg-primary px-6 font-medium text-primary-foreground"
      >
        {t('common.retry')}
      </button>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:groupId" element={<GroupDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId" element={<StudentReportPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="attendance/:lessonId" element={<LessonPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const dbStatus = useAppStore((state) => state.dbStatus)
  const dbError = useAppStore((state) => state.dbError)
  const init = useAppStore((state) => state.init)

  useEffect(() => {
    void init()
  }, [init])

  return (
    <>
      {dbStatus === 'ready' && <AppRoutes />}
      {dbStatus === 'error' && <DbError message={dbError} onRetry={() => void init()} />}
      {(dbStatus === 'idle' || dbStatus === 'loading') && <Splash />}
      {/* Service worker baza holatidan qat'i nazar ro'yxatdan o'tishi kerak */}
      <PwaPrompt />
    </>
  )
}
