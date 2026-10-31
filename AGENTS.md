# AGENTS.md — Yapay Zeka Ajanları İçin Proje Kuralları

Bu dosya, bu repoda kod yazan tüm yapay zeka ajanları (Claude Code, Cursor, Copilot, Codex, ChatGPT, Gemini vb.) içindir. Her oturumun başında bu dosyanın tamamını oku ve buradaki kurallara uy. Buradaki bir kural kullanıcının o anki isteğiyle çelişiyorsa, işe başlamadan önce çelişkiyi kullanıcıya açıkça söyle ve onay iste. Promptta herhangi bir açık uç, anlaşılmayan kısım veya yanlış bir karar varsa bunu kullanıcıyı belirt ve bunu çözüp işe başla.

---

## 1. Proje özeti

Tek bir diş kliniği için WhatsApp üzerinden çalışan randevu sistemi.

- **Hasta tarafı:** Hasta, kliniğin tanıtım sitesindeki WhatsApp butonuna basar ve WhatsApp botuyla yazışarak randevu alır, randevusunu görür, iptal eder veya erteler.
- **Klinik tarafı:** Sekreter, admin panelinden randevu taleplerini onaylar veya reddeder, elle randevu ekler, doktor/işlem/çalışma saatlerini yönetir.
- **Tanıtım sitesi:** Kliniğin herkese açık tek sayfalık sitesi. Doktorları ve tedavileri gösterir, WhatsApp butonu içerir.

### Kapsam dışı (YAPMA)
- Birden fazla klinik desteği (multi-tenant). Sistem tek klinik içindir.
- Randevu hatırlatma mesajları ve zamanlanmış görevler (cron). İptal edildi.
- Online ödeme, hasta hesabı/girişi, e-posta veya SMS gönderimi.
- Admin panelinde birden fazla kullanıcı veya rol. Tek admin hesabı vardır.

Kapsam dışı bir şey gerekiyor gibi görünüyorsa kodu yazma, kullanıcıya sor.

---

## 2. Teknoloji yığını

| Katman | Teknoloji |
|---|---|
| Uygulama | Next.js (App Router) + TypeScript (strict) |
| Stil | Tailwind CSS |
| Veritabanı ve giriş | Supabase (PostgreSQL + Supabase Auth) |
| Supabase istemcisi | `@supabase/supabase-js`, panel oturumu için `@supabase/ssr` |
| Yapay zeka | Google Gemini, `@google/genai` paketi |
| Mesajlaşma | WhatsApp Cloud API (Meta Graph API, doğrudan `fetch` ile) |
| Doğrulama | `zod` |
| Sunucu koruması | `server-only` (sunucu dosyalarının tarayıcıya sızmasını engeller) |
| Yayın | Vercel |
| Paket yöneticisi | npm |

**Sürümler:** `package.json` içindeki sürümler esastır. O sürümün güncel dokümantasyonuna göre kod yaz. Eski kalıpları kullanma: `pages/` klasörü, `getServerSideProps`, `getInitialProps`, eski `@supabase/auth-helpers-nextjs` paketi, eski `@google/generative-ai` paketi YASAK.

**Yeni paket:** Yukarıdaki listede olmayan bir paketi kullanıcıya sormadan ekleme. Gerekiyorsa nedenini açıkla ve onay bekle.

---

## 3. Klasör yapısı ve sahiplik

Her ekip yalnızca kendi alanındaki dosyaları değiştirir. Başka bir alandaki dosyada değişiklik gerekiyorsa **o dosyayı değiştirme**; ne gerektiğini log dosyasına "Başka ekipten istek" olarak yaz ve kullanıcıya söyle.

```
/
├── AGENTS.md, CLAUDE.md, README.md      → Ahmet Yasin (proje lideri)
├── tasks.md          (açık işler)        → Herkes, sadece kendi ekibinin bölümü
├── package.json, tsconfig.json,
│   next.config.*, middleware/proxy,
│   tailwind/postcss ayarları, .env.example → Ahmet Yasin
├── supabase/                             → Ahmet Yasin (SADECE OKU)
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── lib/
│   ├── supabase/      (istemciler)       → Ahmet Yasin
│   ├── database.types.ts (üretilmiş tipler) → Ahmet Yasin
│   ├── shared/        (ortak yardımcılar: tarih, telefon, durum metinleri) → Ahmet Yasin
│   ├── whatsapp/      (Graph API çağrıları, webhook doğrulama, bildirim) → Bot ekibi
│   ├── bot/           (sohbet akışı, adımlar, oturum durumu) → Bot ekibi
│   └── ai/            (Gemini çağrıları ve prompt'lar) → Bot ekibi
├── app/
│   ├── (site)/        (tanıtım sitesi, "/" adresi) → Site ekibi
│   ├── admin/         (admin paneli, "/admin")     → Panel ekibi
│   └── api/whatsapp/webhook/route.ts               → Bot ekibi
├── components/
│   ├── ui/            (ortak küçük bileşenler)     → Ahmet Yasin
│   ├── site/                                       → Site ekibi
│   └── admin/                                      → Panel ekibi
├── scripts/gemini-test/  (Gemini test seti ve script) → Bot ekibi
├── docs/
│   ├── test/          (test senaryoları ve sonuçları) → Test ekibi
│   └── sunum/                                       → Sunum
└── logs/              (her kişinin kendi log dosyası) → Herkes, sadece kendi dosyası
```

Ekipler: **Bot ekibi** Sevde, Ebru · **Panel ekibi** Esma, Merve · **Site ekibi** Ahmet Çiçek, Ebrar · **Test** Tuğba, Nezahat · **Sunum** Belinay · **Lider, veritabanı, entegrasyon** Ahmet Yasin.

Kullanıcının hangi ekipte olduğunu bilmiyorsan, değişiklik yapmadan önce sor.

---

## 4. Veritabanı kuralları

Şema `supabase/01_schema.sql` dosyasındadır. Bir tabloyla çalışmadan önce bu dosyayı oku. Tablo ve sütun isimlerini tahmin etme, dosyadan bak.

### Kesin yasaklar
- Şemayı değiştirme: `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, yeni tablo, yeni sütun, yeni fonksiyon, RLS politikası değişikliği YOK. Şemada eksik bir şey varsa log'a istek olarak yaz.
- `supabase db reset` veya veriyi silen herhangi bir komutu çalıştırma.
- Gerçek kişi bilgisi (gerçek isim, gerçek telefon numarası) ekleme. Test verisi tamamen sahte olmalı.

### Tablolar (özet)
- `clinic_settings` — tek satır (id = 1): klinik adı, `slot_minutes`, `cancel_limit_hours` (iptal sınırı, saat), `booking_window_days`, `time_zone`.
- `doctors`, `procedures`, `doctor_procedures` (hangi doktor hangi işlemi yapar).
- `working_hours` — haftalık saatler, `day_of_week` ISO: 1 = Pazartesi … 7 = Pazar.
- `time_off` — doktor izni (`doctor_id` dolu) veya klinik tatili (`doctor_id` NULL).
- `patients` — `phone` + `full_name`. Telefon tekildir.
- `appointments` — randevular.
- `wa_sessions` — her WhatsApp numarası için sohbet adımı (`step`) ve taslak seçimler (`context`, jsonb).
- `wa_messages` — gelen/giden mesaj kaydı. `wa_message_id` tekildir.

### Randevu durumları
| Değer | Ekranda görünen | Anlamı |
|---|---|---|
| `pending` | Onay bekliyor | Hasta talep etti, saat kilitli |
| `approved` | Onaylandı | Klinik onayladı |
| `rejected` | Reddedildi | Klinik reddetti, saat serbest |
| `cancelled` | İptal edildi | `cancelled_by` = `patient` veya `admin` olmalı |
| `completed` | Tamamlandı | Randevu gerçekleşti |

Durum metinlerini her yerde aynı göstermek için `lib/shared/` altındaki ortak eşlemeyi kullan.

### İş kuralları (veritabanı da uygular, kod da saygı göstermeli)
1. Aynı doktora çakışan iki aktif (`pending`/`approved`) randevu olamaz.
2. Bir hastanın aynı anda yalnızca **bir** aktif ve süresi geçmemiş randevusu olabilir.
3. Hasta, randevusuna `cancel_limit_hours` saatten az kala bot üzerinden iptal veya erteleme yapamaz; bot "lütfen kliniği arayın" der. Bu kural admin paneli için geçerli değildir. Bu kontrolü kod yapar.
4. Bottan gelen randevu `pending` açılır. Panelden elle eklenen randevu `source = 'admin'`, `status = 'approved'` açılır.
5. Erteleme her zaman `reschedule_appointment` fonksiyonuyla yapılır; elle "iptal et + yenisini ekle" yazma.

### Hazır fonksiyonlar (RPC)
```ts
// Müsait saatler. Doktor işlemi yapmıyorsa, gün kapalıysa veya tarih aralık dışındaysa boş döner.
const { data } = await supabase.rpc('get_available_slots', {
  p_doctor_id: 1, p_procedure_id: 3, p_date: '2026-11-05',
}); // [{ slot_start, slot_end }]

// Erteleme: eskiyi iptal eder, yeni saate pending açar, tek işlemde. Yeni id döner.
const { data: newId } = await supabase.rpc('reschedule_appointment', {
  p_appointment_id: 12, p_new_starts_at: '2026-11-05T10:30:00+03:00', p_cancelled_by: 'patient',
});
```
Müsait saatleri asla kendin hesaplama, her zaman `get_available_slots` kullan.

### Hata kodları
Supabase hatalarında `error.code` alanına bak ve kullanıcıya anlaşılır Türkçe mesaj göster:

| Kod | Mesaj (kodda) | Kullanıcıya |
|---|---|---|
| `23P01` | çakışma | "Bu saat az önce doldu, lütfen başka bir saat seçin." |
| `RD001` | `PATIENT_HAS_ACTIVE_APPOINTMENT` | "Zaten aktif bir randevunuz var." (+ görüntüle/iptal/ertele seçenekleri) |
| `RD002` | `APPOINTMENT_NOT_FOUND` | "Randevu bulunamadı." |
| `RD003` | `APPOINTMENT_NOT_ACTIVE` | "Bu randevu artık aktif değil." |
| `RD004` | `SLOT_NOT_AVAILABLE` | "Seçilen saat müsait değil." |
| `23505` | tekil alan çakışması | (ör. aynı telefonla ikinci hasta) duruma göre |

### Tipler
Veritabanı tipleri `lib/database.types.ts` dosyasındadır (Supabase'den üretilir). Supabase istemcisini bu tiplerle kullan, tabloları elle `interface` olarak yeniden tanımlama.

---

## 5. Supabase istemcileri ve gizli anahtarlar

`lib/supabase/` içinde üç istemci vardır; doğru olanı kullan:

| Nerede | İstemci | Anahtar |
|---|---|---|
| Bot (webhook, sunucu) | service role istemcisi | `SUPABASE_SERVICE_ROLE_KEY` (RLS'i atlar) |
| Admin paneli (sunucu bileşenleri, server action'lar) | oturumlu sunucu istemcisi (`@supabase/ssr`) | anon key + admin oturumu |
| Tanıtım sitesi | anon istemci | anon key (sadece okuma) |

### Kesin kurallar
- `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_*`, `GEMINI_API_KEY` yalnızca sunucu kodunda kullanılır. `"use client"` içeren bir dosyaya veya `NEXT_PUBLIC_` ile başlayan bir değişkene ASLA girmez.
- Service role istemcisini panelde veya sitede kullanma.
- Hiçbir anahtarı, token'ı veya şifreyi koda yazma, log'a yazma, `console.log` ile basma, commit'leme.
- `.env.local` dosyasını okuma, değiştirme, içeriğini gösterme. Yeni bir ortam değişkeni gerekiyorsa sadece adını `.env.example`'a eklemeyi öner ve kullanıcıya bildir.

### Ortam değişkenleri
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
WHATSAPP_APP_SECRET
WHATSAPP_API_VERSION
GEMINI_API_KEY
GEMINI_MODEL
NEXT_PUBLIC_WHATSAPP_NUMBER
```
Model adını ve API sürümünü koda sabit yazma, bu değişkenlerden oku.

---

## 6. Tarih, saat ve telefon

- Veritabanında tüm zamanlar `timestamptz`. Klinik saat dilimi `Europe/Istanbul`.
- Vercel sunucuları UTC çalışır. Yerel saati asla `new Date().getHours()` gibi yöntemlerle hesaplama; `Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', ... })` veya `lib/shared/` altındaki yardımcıları kullan.
- "Bugün", "yarın" gibi ifadeler İstanbul saatine göre hesaplanır.
- Kullanıcıya gösterilen tarih formatı: `5 Kasım 2026 Perşembe, 10:30`.
- Telefon numaraları veritabanında WhatsApp'ın gönderdiği biçimde, `+` olmadan ve sadece rakam: `905321234567`. Panelden girilen numarayı kaydetmeden önce bu biçime çevir (`lib/shared/` yardımcısı).

---

## 7. WhatsApp kuralları (bot ekibi)

### Webhook (`app/api/whatsapp/webhook/route.ts`)
- **GET:** Meta doğrulaması. `hub.mode === 'subscribe'` ve `hub.verify_token === WHATSAPP_VERIFY_TOKEN` ise `hub.challenge` değerini düz metin olarak döndür, değilse 403.
- **POST:** Ham gövde üzerinden `X-Hub-Signature-256` imzasını `WHATSAPP_APP_SECRET` ile HMAC-SHA256 kullanarak doğrula. İmza geçersizse 401.
- Aynı mesaj birden fazla gelebilir. İşlemeden önce `wa_message_id` ile `wa_messages` tablosuna yaz; tekil alan hatası (`23505`) alırsan mesajı zaten işlenmiş say ve dur.
- `statuses` (iletildi/okundu bildirimleri) olaylarını işleme, sadece 200 dön.
- Hata olsa bile, hatayı sunucu log'una yazıp **200** dön; aksi halde Meta aynı mesajı tekrar tekrar gönderir. İşlemi kısa tut.
- Her gelen mesajda `wa_sessions.last_inbound_at` güncellenir.

### Mesaj sınırları (Meta kuralları)
- Serbest metin, butonlu ve listeli mesajlar yalnızca hastanın son mesajından sonraki **24 saat** içinde gönderilebilir. Daha sonra gönderim hata verir; bu durumu yakala ve logla, uygulamayı çökertme.
- Butonlu mesaj: en fazla **3 buton**, buton başlığı en fazla **20 karakter**.
- Liste mesajı: toplamda en fazla **10 satır**, satır başlığı en fazla **24**, açıklama en fazla **72** karakter, listeyi açan buton metni en fazla **20** karakter.
- Bir günde 10'dan fazla boş saat olabilir. Saatleri sayfala ("Diğer saatler" satırı) veya sabah/öğleden sonra diye böl. Sınırı aşan mesaj gönderme.
- Test numarası yalnızca kayıtlı 5 numaraya mesaj gönderebilir. Başka numaraya gönderim hatası bir bug değildir.

### Ortak bildirim fonksiyonu
Panel ekibi randevu onay/red/iptal bildirimleri için bot ekibinin şu fonksiyonunu kullanır; imzası değiştirilmez:
```ts
// lib/whatsapp/notify.ts — sadece sunucuda çalışır
export async function notifyAppointmentUpdate(appointmentId: number): Promise<{ sent: boolean; reason?: string }>;
```
24 saat penceresi kapalıysa `{ sent: false, reason: 'WINDOW_CLOSED' }` döner; panel bunu uyarı olarak gösterir.

---

## 8. Sohbet akışı ve Gemini (bot ekibi)

### Akışın temel adımları
Menü → (yeni hastaysa) ad soyad → işlem seçimi → doktor seçimi (işlemi yapan doktorlar; tek doktor varsa atla) → tarih seçimi → saat seçimi → özet ve onay (butonlar: Onayla / Değiştir / Vazgeç) → `pending` randevu oluştur → "Talebiniz alındı, klinik onayladığında bilgilendirileceksiniz."

Ana menü: Randevu al · Randevumu gör · İptal / Ertele. Hasta "menü" yazdığında her adımdan menüye dönebilmeli. Randevu almaya başlamadan önce hastanın aktif randevusu var mı kontrol et.

Adım isimleri `wa_sessions.step`, taslak seçimler `wa_sessions.context` içinde tutulur. Adım isimlerini `lib/bot/` içinde tek bir sabit listede tanımla.

### Gemini'nin rolü
Gemini **sadece** hastanın serbest yazdığı metni yapılandırılmış veriye çevirir. Örnek çıktı:
```json
{ "intent": "book", "procedure": "Dolgu", "date": "2026-11-05", "time_of_day": "afternoon", "time": null }
```
- `intent`: `book` | `view` | `cancel` | `reschedule` | `greeting` | `other`
- İstemde bugünün tarihini (İstanbul) ve veritabanındaki işlem isimlerini ver. "Dişim ağrıyor" gibi belirsiz şikayetleri `Muayene` olarak yorumlat.
- Gemini'den yalnızca JSON iste, cevabı `zod` ile doğrula. Doğrulama başarısızsa veya emin değilsen butonlu menüye geri dön.
- Gemini **asla** müsaitlik kararı vermez, veritabanına yazmaz, hastaya doğrudan cevap metni üretmez. Kararı her zaman kod ve veritabanı verir.
- Gemini'ye hastanın adını veya telefon numarasını gönderme; sadece mesaj metnini gönder.
- Gemini çağrısı başarısız olursa bot çökmez, menüyü gösterir.

### Bot dili
- Türkçe, kısa, nazik, "siz" diliyle. Bir mesajda tek soru.
- Emoji en fazla bir tane ve sadece uygun yerlerde.
- Tıbbi tavsiye verme, teşhis koyma, fiyat söyleme. Bu tür sorularda kliniğin telefon numarasını öner.

---

## 9. Admin paneli kuralları (panel ekibi)

- `/admin` altındaki tüm sayfalar giriş gerektirir. Giriş yapılmamışsa `/admin/login` sayfasına yönlendir.
- Kayıt (sign up) sayfası YAPMA. Tek admin hesabı Supabase'de elle oluşturulmuştur.
- Onay bekleyen randevular ana ekranda en üstte ve dikkat çekici gösterilir.
- Onay/red/iptal işlemi veritabanını güncelledikten sonra `notifyAppointmentUpdate` çağrılır; `sent: false` ise "Hastaya WhatsApp bildirimi gönderilemedi" uyarısı gösterilir.
- Elle randevu eklerken boş saatler `get_available_slots` ile gösterilir. Hasta telefonla bulunur yoksa yeni hasta oluşturulur.
- Veri değiştiren işlemler server action veya route handler ile sunucuda yapılır.
- Panelden erteleme: `reschedule_appointment` (`p_cancelled_by: 'admin'`) yeni randevuyu `pending` açar. Panel, aynı server action içinde dönen yeni id ile randevuyu `approved` yapar, ardından `notifyAppointmentUpdate` çağırır. Veritabanı fonksiyonu değiştirilmez. Bottan gelen erteleme `pending` kalır.
- Doktor pasifleştirme: Doktorun aktif (`pending`/`approved`, süresi geçmemiş) randevusu varsa panel pasifleştirmeden önce uyarı gösterir ve bu randevuları listeler. Randevular admin tarafından elle iptal edilir veya ertelenir; sistem otomatik iptal yapmaz.

## 10. Tanıtım sitesi kuralları (site ekibi)

- Site `app/(site)/` altındadır ve `/` adresinde açılır. Admin paneline link verme.
- Doktor ve işlem listesi veritabanından anon istemciyle okunur (sadece `is_active = true` olanlar).
- WhatsApp butonu: `https://wa.me/${NEXT_PUBLIC_WHATSAPP_NUMBER}?text=` + URL-encode edilmiş "Merhaba, randevu almak istiyorum." Numarayı koda sabit yazma.
- Sayfa bölümleri ayrı bileşenlerdir (`components/site/`): Hero + WhatsApp butonu, Doktorlar, Tedaviler, Hakkımızda, İletişim/SSS. Her kişi kendi bileşeninde çalışır.
- Mobil öncelikli tasarla. Renkleri sabit yazma, Tailwind temasındaki ortak renkleri kullan (panel ve site aynı kimliği taşır).
- Dışarıdan görsel kullanılacaksa telif sorunu olmayan görseller veya yer tutucular kullan.

---

## 11. Kod stili

- TypeScript strict. `any` kullanma; gerekiyorsa `unknown` + doğrulama.
- Dışarıdan gelen her veriyi (webhook gövdesi, form girdisi, Gemini çıktısı) `zod` ile doğrula.
- Varsayılan olarak Server Component; `"use client"` yalnızca etkileşim gerektiğinde.
- Kod içi isimler (değişken, fonksiyon, dosya) İngilizce. Kullanıcıya görünen tüm metinler Türkçe. Yorumlar Türkçe olabilir.
- Dosya isimleri `kebab-case.ts`, React bileşenleri `PascalCase`.
- Küçük, tek işi olan fonksiyonlar yaz. Gereksiz soyutlama, gereksiz yeni dosya ve "ileride lazım olur" kodu yazma.
- Başkasının koduna "iyileştirme" amaçlı dokunma, refactor yapma, biçimlendirmesini değiştirme.
- Hata yutma: `catch` bloğunda hatayı en azından sunucu log'una yaz.

---

## 12. Çalışma akışı

### Her göreve başlarken
1. Bu dosyayı oku.
2. Kullanıcının `logs/<isim>.md` dosyasındaki son kayıtları oku; önceki oturumda ne yapıldığını öğren.
3. `tasks.md` dosyasında kullanıcının ekibine ait açık işleri oku. Yapılacak görevle ilgili bir madde varsa kullanıcıya söyle.
4. İlgili şema veya mevcut kod dosyalarını oku. Tahmin etme.
5. Görev belirsizse veya birden fazla yorum mümkünse önce sor.
6. Büyük bir değişiklikten önce kısa bir plan sun (hangi dosyalar, ne değişecek) ve onay al.

### Açık işler (`tasks.md`)
- Açık işler ve PR incelemelerinde çıkan küçük düzeltmeler kök dizindeki `tasks.md` dosyasında takip edilir. Trello kartı gerektirmeyen her açık iş buraya yazılır.
- Yarım kalan bir iş, bilinen bir eksik veya sonra yapılacak bir düzeltme varsa log'daki "Açık konular" alanına ek olarak `tasks.md`'de kendi ekibinin bölümüne madde olarak ekle.
- Her madde şunları içerir: başlık, dosya (ve varsa PR numarası), sorun, yapılacak. Kısa ve açıklayıcı yaz.
- Sadece kendi ekibinin bölümüne yaz; başka ekibin maddesini değiştirme. Başka ekipten bir şey gerekiyorsa log'a "Başka ekipten istek" olarak yaz.
- Bir maddeyi tamamladığında aynı dalda o maddeyi `tasks.md`'den sil ve log kaydında hangi maddeyi kapattığını belirt.

### Git
- `main` dalına doğrudan commit veya push YAPMA. Her iş kendi dalında: `feat/bot-webhook`, `feat/admin-onay`, `fix/site-buton` gibi.
- Commit mesajları kısa ve açıklayıcı: `feat(bot): randevu iptal akışı eklendi`.
- Yasak komutlar: `git push --force`, `git reset --hard`, `git rebase` (kullanıcı açıkça istemedikçe), `rm -rf`, Vercel'e production deploy.
- `.env*` dosyalarını commit'leme (`.env.example` hariç).

### Commit/PR öncesi kontrol
1. `npm run lint` hatasız.
2. `npm run build` başarılı.
3. Değişiklik elle denendi (nasıl denendiği log'a yazılır).
4. Log kaydı eklendi.
5. Kendi alanının dışında dosya değişmedi (`git status` ile kontrol et).

---

## 13. Log kuralı (ZORUNLU)

Her kişinin kendi log dosyası vardır: `logs/<isim>.md` (ör. `logs/ahmetyasin.md`, `logs/ahmet.md`). Herkes yalnızca kendi dosyasına yazar; bu sayede birleştirmede çakışma olmaz. Dosya yoksa oluştur.

Her görev veya anlamlı değişiklik grubu bittiğinde, commit'ten önce dosyanın **sonuna** şu formatta bir kayıt ekle. Eski kayıtları silme veya değiştirme.

```markdown
## 2026-10-29 14:30 — Kısa başlık
- **Kişi / araç:** Ahmet Yasin / Claude Code
- **Dal:** feat/bot-webhook
- **Ne yapıldı:** 1-3 cümle.
- **Değişen dosyalar:** `app/api/whatsapp/webhook/route.ts`, `lib/whatsapp/verify.ts`
- **Neden:** Hangi görevi/kartı karşılıyor.
- **Nasıl test edildi:** `npm run build` başarılı; test numarasından mesaj atıldı, bot cevap verdi.
- **Açık konular:** Bilinen eksikler, yarım kalanlar.
- **Başka ekipten istek:** (varsa) kimden, ne gerekiyor.
```

Log'a ASLA şifre, token, API anahtarı, gerçek telefon numarası veya hasta bilgisi yazma. Saat İstanbul saatidir.

---

## 14. Emin olmadığında

- Tahmin edip kod yazmak yerine sor.
- Bir dış servisin (WhatsApp, Supabase, Gemini, Next.js) davranışından emin değilsen güncel resmi dokümantasyona bak; hatırladığın eski bir API'yi kullanma.
- Bu dosyadaki bir kural yanlış veya eksik görünüyorsa, kuralı kendin değiştirme; kullanıcıya söyle, kullanıcı Ahmet Yasin'e iletsin.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
