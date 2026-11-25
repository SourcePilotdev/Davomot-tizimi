/** Matnni fayl sifatida yuklab beradi (brauzer "Yuklashlar" papkasiga saqlaydi). */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Yuklash boshlanib bo'lgach havolani bo'shatamiz
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Qurilma faylni "Ulashish" (Telegram, Drive...) orqali yubora oladimi. */
export function canShareFiles(): boolean {
  try {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false
    return navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'application/json' })] })
  } catch {
    return false
  }
}

/** Faylni tizimning "Ulashish" oynasi orqali yuboradi. Foydalanuvchi bekor qilsa — false. */
export async function shareFile(filename: string, content: string, mime: string): Promise<boolean> {
  const file = new File([content], filename, { type: mime })
  try {
    await navigator.share({ files: [file], title: filename })
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false
    throw error
  }
}
