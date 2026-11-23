import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': yangi versiya darhol almashtirilmaydi. O'qituvchi davomat belgilab turgan
      // paytda sahifa o'zi qayta yuklanib ketmasligi uchun almashtirishni foydalanuvchi tasdiqlaydi
      // (qarang: src/components/PwaPrompt.tsx).
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Davomat boshqaruv tizimi',
        short_name: 'Davomat',
        description: "Ta'lim muassasalari uchun offline ishlaydigan davomat kuzatuv ilovasi",
        lang: 'uz',
        dir: 'ltr',
        categories: ['education', 'productivity'],
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#1B2A49',
        background_color: '#F4F6F8',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Ilovaning hamma fayli oldindan keshlanadi — internetsiz ham to'liq ishlaydi.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      // Dev rejimida service worker o'chiq. PWA/offline'ni `npm run build && npm run preview` bilan sinang.
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
