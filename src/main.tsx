import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { applyTheme } from '@/lib/theme'
import './index.css'

// Baza ochilguncha tizim mavzusini qo'llaymiz: qorong'i rejimdagi foydalanuvchi oq "chaqnash" ko'rmasligi uchun.
applyTheme('system')

// HashRouter: manzil "/#/groups" ko'rinishida — hosting qayta yo'naltirish sozlamasini talab qilmaydi
// va offline/PWA rejimida sahifani yangilash 404 bermaydi.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
