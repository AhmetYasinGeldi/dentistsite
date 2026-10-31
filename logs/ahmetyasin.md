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

## 2026-10-31 16:57 — PR #4-#7 incelemesi, açık işler dosyası ve panel kararları
- **Kişi / araç:** Ahmet Yasin / Claude Code
- **Dal:** docs/acik-isler
- **Ne yapıldı:** PR #4, #5, #6 ve #7 incelendi; birleştirmeyi engellemeyen düzeltmeler `tasks.md` dosyasına açık iş olarak yazıldı. AGENTS.md'ye `tasks.md` kuralları (bölüm 3 ve 12) ile panelden erteleme ve doktor pasifleştirme kararları (bölüm 9) eklendi.
- **Değişen dosyalar:** `AGENTS.md`, `tasks.md`, `logs/ahmetyasin.md`
- **Neden:** Küçük düzeltmeleri PR'ları geri göndermeden takip etmek; P8 ve P9 test senaryolarındaki belirsizlikleri kapatmak.
- **Nasıl test edildi:** Dört PR ayrı ayrı ve birlikte origin/main üzerinde `npm run lint` ve `npm run build` ile denendi, hepsi hatasız. PR #5 webhook'u sahte secret ile yerelde denendi (şablon durumu, statuses ve geçersiz `from` 200; yanlış imza 401; yanlış verify token 403). PR #6'da girişsiz `/admin` isteğinin `/admin/login`'e yönlendirildiği görüldü; girişli liste görünümü denenmedi.
- **Açık konular:** PR #6 randevu listesi admin girişiyle elle kontrol edilecek.
- **Başka ekipten istek:** Panel ekibi: 14 ve 15 numaralı kararlar erteleme ve doktor yönetimi yazılırken uygulanacak. Test ekibi: P8 ve P9 senaryoları bu kararlara göre güncellenecek.
