const collator = new Intl.Collator(['uz', 'ru', 'en'], { sensitivity: 'base', numeric: true })

/**
 * Ism va nomlarni tartiblash uchun taqqoslash funksiyasi.
 * Katta/kichik harf farqlanmaydi; raqamlar son sifatida taqqoslanadi ("9-sinf" "10-sinf"dan oldin).
 */
export function compareText(a: string, b: string): number {
  return collator.compare(a, b)
}

// o' va g' harflaridagi turlicha apostroflar: ' ’ ‘ ʻ ʼ ʹ ′ ` ´
const APOSTROPHE_VARIANTS = /[\u2019\u2018\u02BB\u02BC\u02B9\u2032\u0060\u00B4]/g

/**
 * Qidiruv uchun matnni tenglashtiradi: kichik harfga o'tkazadi va turli apostroflarni
 * bittasiga keltiradi — "o'qituvchi" ni "oʻqituvchi" deb yozsangiz ham topiladi.
 */
export function normalizeForSearch(value: string): string {
  return value.replace(APOSTROPHE_VARIANTS, "'").toLowerCase().trim()
}

/** "+998901234567" → "+998 90 123 45 67". Boshqa formatdagi raqamlar o'zgarishsiz qaytadi. */
export function formatPhone(phone: string): string {
  const match = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone)
  return match ? `+998 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone
}
