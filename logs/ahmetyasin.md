# Log — Ahmet Yasin

## 2026-10-28 — Veritabanı şeması ve proje kuralları
- **Kişi / araç:** Ahmet Yasin / Claude
- **Dal:** main (proje başlangıcı)
- **Ne yapıldı:** Supabase şeması (tablolar, müsait saat ve erteleme fonksiyonları, güvenlik kuralları) ve başlangıç verisi hazırlandı. AGENTS.md, CLAUDE.md, README.md ve .env.example eklendi.
- **Değişen dosyalar:** `supabase/01_schema.sql`, `supabase/02_seed.sql`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `.env.example`
- **Neden:** Ekiplerin ortak bir veritabanı ve ortak kurallarla paralel çalışabilmesi.
- **Nasıl test edildi:** Şema PostgreSQL üzerinde kuruldu; müsait saat hesaplama, çakışma engeli, tek aktif randevu kuralı ve erteleme denendi.
- **Açık konular:** Klinik adı, renkler ve logo belirlenecek.
- **Başka ekipten istek:** Yok.

## 2026-10-28 22:58 — Next.js iskeleti ve ortak parçalar
- **Kişi / araç:** Ahmet Yasin / Claude Code
- **Dal:** yok (git henüz başlatılmadı; commit Ahmet Yasin tarafından yapılacak)
- **Ne yapıldı:** Next.js 16.4 (App Router, TS, Tailwind v4, ESLint) kuruldu; supabase-js, @supabase/ssr, @google/genai, zod, server-only eklendi. AGENTS.md'deki klasör yapısı, dört Supabase istemcisi, üretilmiş veritabanı tipleri, ortak yardımcılar (tarih, telefon, durum, hata mesajları), geçici renk paleti, /admin giriş koruması (proxy.ts) ve notifyAppointmentUpdate taslağı hazırlandı.
- **Değişen dosyalar:** `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`, `.gitignore`, `proxy.ts`, `AGENTS.md` (server-only satırı + Next.js'in otomatik bloğu), `app/layout.tsx`, `app/globals.css`, `app/(site)/page.tsx`, `app/admin/page.tsx`, `lib/supabase/{admin,server,client,public}.ts`, `lib/database.types.ts`, `lib/shared/{datetime,phone,appointment-status,errors}.ts`, `lib/whatsapp/notify.ts`, boş klasörlerde `.gitkeep`.
- **Neden:** Ekiplerin ortak iskelet ve yardımcılar üzerinde paralel çalışmaya başlayabilmesi.
- **Nasıl test edildi:** `npm run lint`, `npx tsc --noEmit` ve `npm run build` hatasız. Tarih ve telefon yardımcıları TZ=UTC altında örnek girdilerle denendi. `next start` ile `/` 200, `/admin` ve alt yolları `/admin/login`'e 307, `/admin/login` ve `/api/whatsapp/webhook` yönlendirilmiyor.
- **Açık konular:** `npm run gen:types` CLI ile yetki hatası verdi (giriş yapılan hesap bu projeyi görmüyor); tipler bu sefer Supabase MCP ile üretildi. `appointments.status`, `source`, `cancelled_by` şemada CHECK'li text olduğu için üretilen tip `string`; geçerli değerler `lib/shared/appointment-status.ts` içinde tanımlı. `/admin/login` sayfası panel ekibine kaldı. Renkler ve site başlığı geçici.
- **Başka ekipten istek:** Panel ekibi: `/admin/login` sayfası. Bot ekibi: `lib/whatsapp/notify.ts` içini doldurmak (imza sabit).
