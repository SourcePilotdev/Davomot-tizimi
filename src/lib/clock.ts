/** Shuncha (millisekund) orqaga surilish xato deb hisoblanmaydi: tarmoq vaqti bilan sinxronlashdagi kichik farqlar. */
export const CLOCK_TOLERANCE_MS = 10 * 60 * 1000

/**
 * Qurilma soati orqaga surilganini aniqlaydi: ilova oxirgi marta ochilgan vaqt (lastSeenAt) hozirgi
 * vaqtdan KEYIN bo'lsa — soat noto'g'ri, yangi darslar noto'g'ri sanada saqlanib qoladi.
 * Vaqt mintaqasini o'zgartirish yoki yozgi/qishki vaqtga o'tish bunga ta'sir qilmaydi (ikkalasi ham UTC ms).
 * Muammo bo'lsa — oxirgi ochilgan vaqtni (UTC ms) qaytaradi, bo'lmasa null.
 */
export function clockBehindSince(lastSeenAt: number | null, now: number): number | null {
  return lastSeenAt !== null && lastSeenAt - now > CLOCK_TOLERANCE_MS ? lastSeenAt : null
}
