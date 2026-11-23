# Davomat — davomat boshqaruv tizimi

Ta'lim muassasalari (repetitorlik markazlari, maktablar, kurslar) uchun telefonda ishlaydigan **to'liq offline** davomat ilovasi. Barcha ma'lumot qurilmaning o'zida (IndexedDB) saqlanadi, server talab qilinmaydi.

**Hozirgi holat: 4-bosqich** — statistika va hisobotlar (davomat foizi, grafiklar, reyting, darslar tarixi), CSV/PDF eksport, JSON zaxira nusxasi va uni qayta tiklash. Zaxira eslatmasi, virtual scrolling va yakuniy sayqal 5-bosqichda.

## Birinchi marta ishga tushirish (Windows)

Bu oddiy HTML sayt emas, **Vite + React loyihasi**. U Live Server bilan yoki `index.html` ni ikki marta bosib ochilmaydi: avval kutubxonalar o'rnatilishi (`npm install`), keyin dev-server ishga tushirilishi kerak.

1. **Node.js o'rnating.** https://nodejs.org → **LTS** versiyasi. O'rnatgach yangi terminalda `node -v` yozing: 18.18 yoki undan yuqori bo'lishi kerak (22 LTS tavsiya etiladi).
2. **ZIP'ni to'liq oching:** o'ng tugma → *Extract all*. ZIP ichidan turib ishlatmang. Oddiy papka tanlang, masalan `C:\davomat-tizimi`.
3. **`start-windows.bat` ni ikki marta bosing.** U o'zi `npm install` va `npm run dev` ni bajaradi, so'ng brauzerda http://localhost:5173 ochiladi. Birinchi marta o'rnatish bir necha daqiqa oladi.

Qo'lda ishga tushirish: papkani VS Code'da oching → Terminal → ochiladigan ro'yxatdan **Command Prompt (cmd)** ni tanlang:

```bash
npm install
npm run dev
```

### Eng ko'p uchraydigan xatolar

| Nima ko'rinadi | Sabab | Yechim |
| --- | --- | --- |
| `npm : File ...npm.ps1 cannot be loaded because running scripts is disabled` | PowerShell skriptlarni taqiqlagan | `start-windows.bat` dan foydalaning yoki terminalni **Command Prompt** ga almashtiring. Yoki PowerShell'da bir marta: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `'npm' is not recognized` | Node.js o'rnatilmagan yoki terminal eski | Node.js'ni o'rnating, VS Code/terminalni yopib qayta oching |
| `Node.js ... juda eski` | Node versiyasi past | https://nodejs.org dan LTS yuklang |
| VS Code'da hamma joy qizil: `Cannot find module 'react'` | `npm install` bajarilmagan | `npm install`, keyin Ctrl+Shift+P → *TypeScript: Restart TS Server* |
| Oq sahifa, konsolda `MIME type` xatosi | Live Server yoki fayl to'g'ridan-to'g'ri ochilgan | `npm run dev` ni ishga tushirib, http://localhost:5173 ni oching |
| `ENOENT ... package.json` | Noto'g'ri papkada turibsiz | `cd davomat-tizimi`: `package.json` shu papkada bo'lishi kerak |
| `EPERM` / `EACCES` | Papka himoyalangan yoki antivirus xalaqit beryapti | Loyihani `C:\davomat-tizimi` kabi oddiy papkaga ko'chiring |
| `ERESOLVE` (versiyalar to'qnashuvi) | Eski npm | `npm install --legacy-peer-deps` |
| `index.css` da sariq chiziqlar (`@theme`, `@apply`) | VS Code Tailwind 4 sintaksisini bilmaydi | Bu xato emas. `.vscode/settings.json` da o'chirilgan; "Tailwind CSS IntelliSense" kengaytmasini o'rnating |

Hali ham xato chiqsa: terminaldagi **birinchi qizil xato matnini** (yoki skrinshotni) yuboring.

## Texnologiyalar

React 19 · Vite 6 · TypeScript · Tailwind CSS 4 + shadcn/ui · Zustand · Dexie.js · vite-plugin-pwa · React Router (HashRouter)

## Sahifalar

| Manzil | Sahifa | Nima qilish mumkin |
| --- | --- | --- |
| `/#/` | Bosh sahifa | Shu oy davomati, bugungi darslar, "e'tibor talab qiladi" ro'yxati; pastda baza holati (dev rejimida demo ma'lumot tugmalari) |
| `/#/groups` | Guruhlar | Ro'yxat (o'quvchilar soni bilan), nom bo'yicha qidiruv, guruh qo'shish |
| `/#/groups/:id` | Guruh | Nomini tahrirlash, o'quvchilar ro'yxati (qidiruv + holat filtri), o'quvchi qo'shish/tahrirlash/o'chirish, guruhni o'chirish |
| `/#/students` | O'quvchilar | Hamma o'quvchilar: qidiruv (ism yoki telefon), guruh va holat filtri, qo'shish/tahrirlash/o'chirish, boshqa guruhga ko'chirish |
| `/#/students/:id` | O'quvchi hisoboti | Davomat foizi (umumiy yoki davr bo'yicha), oylar bo'yicha grafik, belgilar tarixi, telefon (bir bosishda qo'ng'iroq) |
| `/#/attendance` | Davomat | Bugun: har bir guruhda bitta bosishda dars boshlash; yangi dars formasi; oxirgi darslar (holatlar hisobi bilan) |
| `/#/attendance/:id` | Dars | Davomat belgilash, darsni tahrirlash va o'chirish |
| `/#/reports` | Hisobot | Guruh va davr bo'yicha foiz, darslar dinamikasi, reyting, o'quvchilar ro'yxati, darslar tarixi; CSV va PDF |
| `/#/settings` | Sozlamalar | Zaxira nusxasi (olish, ulashish, tiklash), CSV jadval, foiz hisoblash qoidasi, til va mavzu (tepadagi tishli g'ildirak belgisi) |

O'chirishdan oldin tasdiq oynasi nimalar birga o'chishini ko'rsatadi: guruh uchun o'quvchilar, darslar va davomat yozuvlari soni, o'quvchi uchun davomat yozuvlari soni.

## Davomat qanday ishlaydi

1. **Dars boshlash.** Davomat → "Bugun" ro'yxatida guruh yonidagi **Boshlash** hozirgi sana va vaqt bilan dars yaratadi. Guruhning bugungi darsi allaqachon bo'lsa, o'sha ochiladi: takroriy dars yaratilmaydi. Boshqa sana yoki vaqt uchun (masalan, kecha o'tgan dars) **Yangi dars** formasi bor. Guruh sahifasida ham **Dars boshlash** tugmasi bor.
2. **Belgilash.** Har bir o'quvchida to'rtta tugma: Keldi, Kelmadi, Kech keldi, Sababli. Faqat tanlangan holat rangli. Tanlangan holatni qayta bossangiz, belgi olib tashlanadi. **Kech keldi** bosilganda daqiqa tanlanadi (5, 10, 15, 20, 30, 45 yoki boshqa son, 1–600). **Hammasi keldi** faqat hali belgilanmagan o'quvchilarni to'ldiradi, mavjud belgilar o'zgarmaydi.
3. **Saqlash.** Har bir bosish darhol saqlanadi: "Saqlash" tugmasi ham, internet ham kerak emas. Ekran bazadan javob kutmaydi, belgi bosilgan zahoti ko'rinadi. Yozish xato bersa, belgi qaytariladi va xabar chiqadi.
4. **Ro'yxat tarkibi.** Guruhning faol o'quvchilari va shu darsda belgisi bor o'quvchilar. Keyin nofaol bo'lsa yoki boshqa guruhga ko'chirilsa ham, eski belgisi ko'rinadi va tahrirlanadi. Belgisiz nofaol o'quvchi ro'yxatda chiqmaydi.
5. **Telefon soati.** Ilova har ochilganda oxirgi ochilgan vaqt bilan solishtiriladi. Hozirgi vaqt undan oldin bo'lsa (soat orqaga surilgan), Davomat sahifasida ogohlantirish chiqadi, aks holda yangi darslar noto'g'ri sanada saqlanadi. Vaqt mintaqasini o'zgartirish yoki yozgi/qishki vaqtga o'tish buni ishga tushirmaydi.

## Statistika va hisobotlar

**Davomat foizi** = (Keldi + Kech keldi) / (Keldi + Kech keldi + Kelmadi + Sababli) × 100.

- "Kech keldi" darsga kelgan hisoblanadi.
- "Sababli" kelmagan darslar foizga ta'siri Sozlamalarda tanlanadi: **Kelmagan deb hisoblash** (standart) yoki **Hisobga olmaslik** (maxrajdan chiqariladi). Ikkala holatda ham reyting va hisoblar shu qoidaga mos.
- Hisoblash uchun belgi bo'lmasa, foiz o'rniga "–" ko'rsatiladi (0% emas).
- **Davrlar:** shu oy (1-kundan bugungacha), oxirgi 7 kun, oxirgi 30 kun, hammasi va "boshqa davr" (ikki sana; chalkash kiritilsa o'zi almashtiriladi). Sanalar mahalliy satr bo'lgani uchun vaqt mintaqasi va DST hisobga ta'sir qilmaydi.
- **Reyting** ("Eng ko'p dars qoldirganlar"): qoldirgan darslar soni bo'yicha (Kelmadi + hisoblash qoidasiga ko'ra Sababli), teng bo'lsa foizi pastroq birinchi. Eng ko'pi 5 ta.
- **Bosh sahifadagi "E'tibor talab qiladi":** shu oy davomati 75% dan past va kamida 3 ta belgisi bor o'quvchilar (`ATTENTION_RATE`, `ATTENTION_MIN_MARKS`: `src/db/stats.ts`).
- **Grafiklar** kutubxonasiz, oddiy HTML/CSS bilan chiziladi (arzon telefonlarda yengil): holatlar ulushi chizig'i, darslar bo'yicha ustunlar, oylar bo'yicha foiz.

## Zaxira nusxasi va eksport

- **JSON zaxira** (Sozlamalar → Zaxira olish): barcha guruh, o'quvchi, dars va davomat yozuvlari + foydalanuvchi tanlovlari (til, mavzu, hisoblash qoidasi). Qurilmaga xos qiymatlar (`deviceId`, `lastSeenAt`) kirmaydi. Fayl nomi: `davomat-zaxira-YYYY-MM-DD-HHMM.json`. Telefonda "Ulashish" tugmasi ham chiqadi (Telegram, Google Drive va h.k.).
- **Tiklash:** fayl avval qat'iy tekshiriladi: JSON ekani, format va versiya, har bir maydon, sana/vaqt, holatlar, takroriy ID, bog'lanishlar (o'quvchi → guruh, davomat → dars va o'quvchi). Bitta xato bo'lsa, HECH NARSA o'zgarmaydi va xato joyi ko'rsatiladi. Tekshiruvdan o'tsa, tasdiq oynasi hozirgi va zaxiradagi ma'lumotlar sonini ko'rsatadi. Tiklash hozirgi ma'lumotni **to'liq almashtiradi**, hammasi bitta tranzaksiyada: yozish o'rtasida xato bo'lsa, eski ma'lumot butun qoladi.
- **CSV jadval** (Sozlamalar → Davomat jadvali): barcha davomat yozuvlari bitta jadvalda. Hisobot sahifasida esa joriy hisobot (o'quvchilar bo'yicha) CSV qilib yuklanadi.
  - Ajratuvchi **nuqtali vergul** (`;`): o'zbek/rus mintaqa sozlamali Excel shuni kutadi. UTF-8 BOM bilan: `oʻ`, `gʻ` va kirill harflar to'g'ri ochiladi.
  - `=`, `+`, `-`, `@` bilan boshlangan matn formula bo'lib ketmasligi uchun oldiga `'` qo'yiladi (CSV injection himoyasi).
- **PDF:** Hisobot sahifasidagi "PDF" tugmasi brauzerning chop etish oynasini ochadi, u yerda "PDF sifatida saqlash" tanlanadi. Qo'shimcha kutubxona kerak emas va hamma harflar to'g'ri chiqadi. Chop etishda navigatsiya va tugmalar yashirinadi, mavzu har doim yorug' bo'ladi.

## Interfeys komponentlari (`src/components/ui`)

shadcn/ui uslubidagi o'zimizning komponentlar. Radix o'rniga brauzerning o'z elementlari ishlatilgan: telefonda yengil va qulay.

| Komponent | Vazifasi |
| --- | --- |
| `Button`, `buttonClass` | Tugma (primary, outline, destructive...), kamida 44px balandlik. `buttonClass` havolani tugma ko'rinishiga keltiradi |
| `Field`, `Input`, `Select` | Sarlavha + maydon + xato matni (aria bilan bog'langan). `Select` — tizimning o'z tanlash oynasi |
| `Dialog` | Brauzerning `<dialog>` elementi: telefonda pastdan chiqadi, Esc va orqa fonni bosish bilan yopiladi |
| `ConfirmDialog` | O'chirish tasdig'i; fokus "Bekor qilish" tugmasida boshlanadi |
| `SegmentedControl` | 2–3 variantdan birini tanlash (holat filtri) |
| `SearchInput`, `EmptyState` | Qidiruv maydoni, bo'sh ro'yxat holati |

## Buyruqlar

```bash
npm run dev        # http://localhost:5173 — ishlab chiqish
npm run build      # production build (dist/)
npm run preview    # http://localhost:4173 — production build; PWA/offline shu yerda sinaladi
npm run typecheck  # TypeScript tekshiruvi (build'ga xalaqit bermaydi, alohida ishga tushiriladi)
```

**Bazani tekshirish:** `npm run dev` → "Bosh sahifa" → **Demo ma'lumot qo'shish** (tugmalar faqat dev rejimida ko'rinadi). Sonlar jonli yangilanadi. Bazani ko'rish: DevTools → Application → IndexedDB → `davomat-tizimi`.

## PWA va offline'ni sinash

Service worker faqat production build'da ishlaydi:

1. `npm run build` va `npm run preview`
2. Chrome'da `http://localhost:4173` ni oching — "Ilova internetsiz ishlashga tayyor" xabari chiqadi.
3. DevTools → Application → Service Workers → **Offline** ni belgilab, sahifani yangilang — ilova ishlashda davom etadi.
4. Brauzer menyusidan "Install app" / "Bosh ekranga qo'shish".

**Telefonda sinash**

- Faqat interfeys uchun: `npm run dev -- --host`, so'ng telefondan `http://<kompyuter-IP>:5173`. Bu HTTP, shuning uchun service worker ishlamaydi (ilovaning o'zi ishlaydi).
- PWA uchun: HTTPS hostingga joylang (Netlify, Vercel, Cloudflare Pages, GitHub Pages) yoki USB orqali: `adb reverse tcp:4173 tcp:4173`, so'ng telefon Chrome'ida `http://localhost:4173` (localhost xavfsiz kontekst hisoblanadi).
- Kichik yo'l (subpath) ostida joylasangiz (masalan, GitHub Pages), `vite.config.ts` da `base` hamda manifestdagi `start_url` va `scope` ni moslang.
- iPhone: Safari bosh ekranga qo'shilmagan saytlarning ma'lumotlarini 7 kun ishlatilmasa o'chirishi mumkin. Ilovani **Bosh ekranga qo'shing** va zaxira nusxasini muntazam oling (Sozlamalar → Zaxira nusxasi).

## Loyiha tuzilishi

```
davomat-tizimi/
├── start-windows.bat           # Windows: bir bosishda o'rnatish + ishga tushirish
├── scripts/check-node.mjs      # Node versiyasini tekshiradi (eski bo'lsa tushunarli xabar chiqaradi)
├── public/                     # PWA ikonkalari: icon.svg, 192/512, maskable, apple-touch
├── src/
│   ├── db/
│   │   ├── database.ts         # Dexie nusxasi, jadvallar, indekslar, sxema versiyasi
│   │   ├── types.ts            # Group, Student, Lesson, Attendance, AppSettings
│   │   ├── validation.ts       # ValidationError va matn/telefon/sana/davomat tekshiruvlari
│   │   ├── init.ts             # initDatabase(): ochish, deviceId, doimiy xotira
│   │   ├── maintenance.ts      # clearAllData()
│   │   ├── stats.ts            # davomat foizi, hisobot, o'quvchi hisoboti, dashboard, jadval
│   │   ├── backup.ts           # zaxira yaratish, tekshirish (parseBackup), tiklash
│   │   ├── devSeed.ts          # demo ma'lumot (faqat dev)
│   │   ├── index.ts            # yagona kirish nuqtasi: import { ... } from '@/db'
│   │   └── repo/               # CRUD: groups, students, lessons, attendance, settings
│   ├── components/
│   │   ├── ui/                 # Button, Field, Dialog, ConfirmDialog, SegmentedControl, SearchInput, EmptyState
│   │   ├── groups/             # GroupFormDialog
│   │   ├── students/           # StudentFormDialog, StudentList, useStudentEditor
│   │   ├── attendance/         # AttendanceRow, LateMinutesDialog, LessonFormDialog, LessonRow, StatusCounts
│   │   ├── reports/            # AttendanceBar, LessonTrend, MonthlyChart, ReportFilters, StudentRateRow
│   │   └── layout/, icons.tsx, PwaPrompt.tsx, DevTools.tsx
│   ├── pages/                  # Home, Groups, GroupDetail, Students, StudentReport, Attendance, Lesson, Reports, Settings
│   ├── store/useAppStore.ts    # Zustand: baza holati, til, mavzu
│   ├── hooks/                  # useLiveQuery (Dexie so'rovini kuzatadi), useToday, usePeriod (hisobot davri)
│   ├── i18n/                   # uz.ts (asosiy), en.ts, useT()
│   ├── lib/                    # date, period, id, text, format, status, clock, csv, download, errors, theme, utils (cn)
│   └── App.tsx · main.tsx · index.css · vite-env.d.ts
├── .vscode/                    # VS Code sozlamalari
├── components.json             # shadcn/ui sozlamasi
├── vite.config.ts              # React + Tailwind + PWA (manifest, workbox)
└── index.html · package.json · tsconfig*.json · .nvmrc
```

## Ma'lumotlar bazasi

Har bir yozuvda `id` (UUID), `created_at` va `updated_at` (UTC ms) bor — jadvallar ro'yxatida ular qisqartirib yozilgan.

| Jadval | Asosiy maydonlar | Indekslar |
| --- | --- | --- |
| `groups` | name | id, name, created_at |
| `students` | group_id, full_name, phone, parent_phone, status (`active` / `inactive`) | id, group_id, status, full_name, [group_id+status] |
| `lessons` | group_id, date (`YYYY-MM-DD`), topic, start_time (`HH:mm`) | id, group_id, date, [group_id+date] |
| `attendance` | lesson_id, student_id, status (`present` / `absent` / `late` / `excused`), late_minutes | id, lesson_id, student_id, status, [student_id+status] |
| `settings` | key, value, updated_at | key |

Komponentlar `db` ga to'g'ridan-to'g'ri murojaat qilmaydi, `@/db` dagi funksiyalardan foydalanadi:

| Modul | Funksiyalar |
| --- | --- |
| groups | `createGroup`, `updateGroup`, `deleteGroup` (kaskad), `getGroup`, `listGroups`, `listGroupsWithStats`, `filterGroups`, `getGroupImpact` |
| students | `createStudent`, `updateStudent`, `deleteStudent`, `getStudent`, `listStudents({ groupId, status, search })`, `filterStudents`, `getStudentImpact` |
| lessons | `createLesson`, `updateLesson`, `deleteLesson`, `getLesson`, `listLessons({ groupId, from, to })`, `startLesson`, `getLessonImpact` |
| attendance | `saveLessonAttendance`, `setAttendance`, `clearAttendance`, `getLessonAttendance`, `getStudentAttendance`, `getLessonSheet`, `listLessonSummaries`, `countStatuses` |
| settings | `getSettings`, `updateSettings` |
| stats | `attendanceRate`, `missedCount`, `monthlyRates`, `getAttendanceReport`, `getStudentReport`, `getDashboard`, `listAttendanceRows` |
| backup | `createBackup`, `serializeBackup`, `parseBackup`, `restoreBackup`, `backupFilename`, `markBackupSaved`, `getDataCounts` |

```ts
import { createGroup, createStudent, createLesson, saveLessonAttendance } from '@/db'

const group = await createGroup({ name: 'Ingliz tili A2' })
const aziza = await createStudent({ group_id: group.id, full_name: 'Aziza Karimova', parent_phone: '+998 93 123 45 67' })
const lesson = await createLesson({ group_id: group.id, topic: 'Present Simple' }) // sana va vaqt — hozirgi
await saveLessonAttendance(lesson.id, [{ student_id: aziza.id, status: 'late', late_minutes: 10 }])
```

Noto'g'ri ma'lumotda `ValidationError` (`error.code`) tashlanadi. Interfeys uni `errors.<kod>` tarjimasi orqali ko'rsatadi.

## Qabul qilingan qarorlar

- **ID — UUID.** Qurilmada yaratiladi va boshqa qurilmalar bilan to'qnashmaydi: bulut sinxronizatsiyasi qo'shilganda qayta raqamlash kerak bo'lmaydi.
- **Sana — mahalliy satr** (`YYYY-MM-DD`, `HH:mm`). `toISOString()` ishlatilmaydi, shuning uchun UTC siljishi kechqurungi darslarning sanasini buzmaydi. Kun qo'shish kalendar kuni bo'yicha bajariladi, shuning uchun DST ta'sir qilmaydi (`src/lib/date.ts`).
- **Davomat ID'si deterministik** (`darsID_o'quvchiID`): bir o'quvchiga bir dars uchun faqat bitta yozuv bo'ladi, qayta saqlash uni yangilaydi.
- **"Kech keldi"** uchun daqiqa majburiy (1–600), boshqa holatlarda `late_minutes` doim 0.
- **O'chirish kaskadli va tranzaksiyali:** guruh → o'quvchilar, darslar, davomat; o'quvchi/dars → o'zining davomat yozuvlari. Yo hammasi o'chadi, yo hech narsa.
- **Doimiy xotira** (`navigator.storage.persist()`) ishga tushganda so'raladi. Natija Bosh sahifada ko'rinadi.
- **Service worker `prompt` rejimida:** yangi versiya o'zi qayta yuklamaydi. O'qituvchi davomat belgilab turganda sahifa yangilanib ketmaydi.
- **HashRouter** (`/#/groups`): hosting qayta yo'naltirish sozlamasini talab qilmaydi.
- **Vite 6:** Node 18.18+ va 20.x ning eski versiyalarida ham ishlaydi (Vite 7 uchun Node 20.19+ kerak).
- **Qidiruv xotirada:** ro'yxat bir marta o'qiladi, har bir harf bosilganda bazaga murojaat qilinmaydi. Qidiruv kichik/katta harfni va turli apostroflarni (`'`, `’`, `ʻ`) farqlamaydi; faqat raqamdan iborat so'rov telefon bo'yicha qidiradi.
- **Telefon raqami** saqlashda tozalanadi (`+998901234567`), ko'rsatishda `+998 90 123 45 67` ko'rinishiga keltiriladi.
- **Nofaol o'quvchi** ro'yxatda xira va "Nofaol" belgisi bilan ko'rinadi. 3-bosqichda u yangi darslarning davomat ro'yxatida chiqmaydi, eski davomati saqlanadi (forma ostidagi izohda yozilgan).
- **Faqat bosish (tap), swipe yo'q:** to'rtta tugmali qator tasodifiy siljitishlarsiz tez va aniq ishlaydi. "Hammasi keldi" dan keyin odatda faqat istisnolarni belgilash qoladi.
- **Optimistik interfeys:** belgi bazadan javob kutmasdan ko'rinadi (arzon telefonda ham tez seziladi). Qatorlar `memo` bilan o'ralgan, shuning uchun bitta o'quvchi belgilanganda qolganlari qayta chizilmaydi.
- **PDF brauzerning chop etish oynasi orqali:** jsPDF kabi kutubxona o'rniga. Yengil, offline ishlaydi, o'zbek va kirill harflari uchun shrift joylash shart emas.
- **Grafiklar kutubxonasiz:** Recharts/Chart.js o'rniga oddiy HTML/CSS. Dastur hajmi kichik qoladi, arzon telefonlarda tez chiziladi.
- **Soya va blur yo'q:** arzon Android telefonlarda sekinlashtiradi. Tizim shriftlari ishlatiladi (yuklash yo'q, o'zbek harflari to'liq qo'llanadi).
- **Ikonkalar** o'zimizning kichik SVG'lar (`src/components/icons.tsx`), tashqi kutubxonasiz. shadcn/ui komponentlari kerak bo'lsa, `lucide-react` ni CLI o'zi o'rnatadi.
- **`dexie-react-hooks` o'rniga** o'zimizning kichik `useLiveQuery` (`src/hooks`): bir xil imzo, bitta bog'liqlik kam. Xohlasangiz paketga almashtirish mumkin.
- **Sinxronizatsiyaga tayyorlik:** UUID, `updated_at`, `@/db` repozitoriy qatlami va `deviceId` sozlamasi tayyor. Sinxronizatsiya qo'shilganda `db.version(2)` bilan `updated_at` indeksi va o'chirilgan yozuvlar belgisi (tombstone) qo'shiladi.

## Dizayn tokenlari

Rang faqat davomat holatini bildiradi — qolgan hamma narsa "qog'ozdagi siyoh". Asosiy (primary) rang ko'k emas, to'q siyoh rangi: u "Sababli" (ko'k) bilan adashtirilmaydi. Tokenlar `src/index.css` da (yorug' va `.dark`):

| Holat | Sinf | Rang |
| --- | --- | --- |
| Keldi | `bg-present` | yashil |
| Kelmadi | `bg-absent` | qizil |
| Kech keldi | `bg-late` | sariq |
| Sababli | `bg-excused` | ko'k |

Har biri uchun `text-*-foreground` jufti ham bor. Qora rejim: Sozlamalar → Ko'rinish (tizim / yorug' / qorong'i).

## Brauzer qo'llab-quvvatlashi

Tailwind CSS 4 talabi: Chrome 111+, Safari 16.4+, Firefox 128+. Bundan eski qurilmalarda (masalan, 2017-yildan oldingi Android) uslublar buzilishi mumkin. Agar shunday telefonlar kerak bo'lsa, Tailwind 3.4 ga o'tkazish mumkin — keyingi bosqichlardan oldin ayting.

## shadcn/ui komponentlarini qo'shish

`components.json` va `cn()` tayyor. Hozirgi komponentlar (`src/components/ui`) o'zimizniki, shuning uchun shadcn CLI shart emas. Keyinchalik kerak bo'lsa (masalan, `calendar`, `popover`) CLI bilan qo'shish mumkin; `button` kabi mavjud fayllarni CLI qayta yozishni so'raganda, o'zimizniki qolishini tanlang.

## Tarjimalar

Interfeysdagi barcha matn `src/i18n/uz.ts` da. O'z tarjimalaringizni shu faylga qo'ying, **kalitlar o'zgarmasin**. `en.ts` aynan shu kalitlarga ega bo'lishi shart (kalit yetishmasa yoki ortiqcha bo'lsa, `npm run typecheck` xato beradi).

## Bosqichlar

1. Loyiha sozlamalari va baza
2. O'quvchi va guruh boshqaruvi
3. Davomat belgilash (asosiy funksiya)
4. **Statistika, hisobotlar va zaxira nusxasi** ← hozirgi holat
5. Yaxshilash: zaxira eslatmasi (7 kun), virtual scrolling, yuklanish/xato holatlari, "Orqaga" tugmasi, ishlashni optimallashtirish
