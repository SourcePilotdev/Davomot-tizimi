import { ValidationError } from '@/db'
import type { TFunction } from '@/i18n'

/**
 * Xatoni foydalanuvchiga ko'rsatish uchun matnga aylantiradi.
 * Tekshiruv xatolari (ValidationError) tarjima qilinadi; kutilmagan xatolar konsolga yoziladi
 * va umumiy xabar ko'rsatiladi.
 */
export function errorMessage(t: TFunction, error: unknown): string {
  if (error instanceof ValidationError) return t(`errors.${error.code}`)
  console.error(error)
  return t('errors.unknown')
}
