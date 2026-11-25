import { useRegisterSW } from 'virtual:pwa-register/react'
import { useT } from '@/i18n'

/**
 * Service worker holati haqida xabar beradi:
 *  - birinchi o'rnatishdan so'ng: "internetsiz ishlashga tayyor";
 *  - yangi versiya chiqqanda: "Yangilash" / "Keyinroq". Sahifa foydalanuvchi tasdiqlamaguncha
 *    qayta yuklanmaydi, shuning uchun davomat belgilash paytida hech narsa yo'qolmaydi.
 */
export function PwaPrompt() {
  const t = useT()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => console.error("Service worker ro'yxatdan o'tmadi:", error),
  })

  if (!offlineReady && !needRefresh) return null

  const dismiss = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-lg border bg-card p-4 text-card-foreground"
    >
      <p className="font-medium">{needRefresh ? t('pwa.updateAvailable') : t('pwa.offlineReady')}</p>
      <div className="mt-3 flex gap-2">
        {needRefresh && (
          <button
            type="button"
            onClick={() => void updateServiceWorker(true)}
            className="min-h-12 flex-1 rounded-lg bg-primary px-4 font-medium text-primary-foreground"
          >
            {t('pwa.update')}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="min-h-12 flex-1 rounded-lg border px-4 font-medium"
        >
          {needRefresh ? t('pwa.later') : t('common.close')}
        </button>
      </div>
    </div>
  )
}
