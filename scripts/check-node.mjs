// Node.js versiyasini tekshiradi: eski bo'lsa, tushunarli xabar chiqarib to'xtaydi.
// package.json dagi preinstall / predev / prebuild / prepreview skriptlaridan chaqiriladi.
const REQUIRED = [18, 18] // [major, minor]
const [major, minor] = process.versions.node.split('.').map(Number)
const isOk = major > REQUIRED[0] || (major === REQUIRED[0] && minor >= REQUIRED[1])

if (!isOk) {
  console.error(`
Node.js ${process.versions.node} juda eski: bu loyiha uchun ${REQUIRED.join('.')} yoki undan yangi versiya kerak (22 LTS tavsiya etiladi).

  1) https://nodejs.org saytidan "LTS" versiyasini yuklab o'rnating.
  2) VS Code va terminalni yopib, qayta oching.
  3) "node -v" bilan versiyani tekshiring va buyruqni qaytadan bajaring.
`)
  process.exit(1)
}
