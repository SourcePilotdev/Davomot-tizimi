import { useCallback } from 'react'
import type { Language } from '@/db'
import { useAppStore } from '@/store/useAppStore'
import { en } from './en'
import { ru } from './ru'
import { tg } from './tg'
import { uz, type Dictionary } from './uz'

/** "nav.home" kabi nuqtali kalitlar. Noto'g'ri kalit yozilsa, TypeScript xato beradi. */
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`
}[keyof T & string]

export type TranslationKey = DotPaths<Dictionary>
export type TranslateParams = Record<string, string | number>
export type TFunction = (key: TranslationKey, params?: TranslateParams) => string

const dictionaries: Record<Language, Dictionary> = { uz, en, ru, tg }

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let node: unknown = dictionary
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** Matnni tanlangan tilda qaytaradi; topilmasa o'zbekchasini, u ham bo'lmasa kalitning o'zini. */
export function translate(language: Language, key: TranslationKey, params?: TranslateParams): string {
  const text = lookup(dictionaries[language], key) ?? lookup(en, key) ?? lookup(uz, key) ?? key
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

/** Komponentlarda: `const t = useT(); t('nav.home')`. Til o'zgarganda komponent qayta chiziladi. */
export function useT(): TFunction {
  const language = useAppStore((state) => state.language)
  return useCallback<TFunction>((key, params) => translate(language, key, params), [language])
}
