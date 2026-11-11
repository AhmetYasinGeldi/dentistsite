## 2026-11-05 — Doktorlar ve tedaviler bölümü
- **Kişi / araç:** Ahmet Çiçek / Gemini
- **Dal:** feat/doktorlar-tedaviler
- **Ne yapıldı:** Veritabanından doktorlar ve tedaviler verisini çekerek listeleyen `Doctors.tsx` ve `Treatments.tsx` bileşenleri oluşturuldu. Aktiflik (`is_active`) kontrolü eklendi. Bu bileşenler `page.tsx` içinde birleştirildi.
- **Değişen dosyalar:** `app/(site)/page.tsx`, `components/site/Doctors.tsx`, `components/site/Treatments.tsx`
- **Neden:** Ziyaretçilerin hekim kadrosunu ve sunulan tedavi seçeneklerini görebilmesi için.
- **Nasıl test edildi:** Kodlar oluşturuldu, Supabase çevresel değişkenleri bekleniyor.
- **Açık konular:** .env.local bilgileri girildikten sonra veri akışı kontrol edilecek.
- **Başka ekipten istek:** Yok.

## 2026-11-05 16:03 — PR #29 inceleme düzeltmeleri
- **Kişi / araç:** Ahmet Çiçek / Antigravity (Gemini)
- **Dal:** feat/doktorlar-tedaviler
- **Ne yapıldı:** `app/(site)/page.tsx` içinde `Treatments` ve `Doctors` bileşenleri `cacheComponents` uyumu için ayrı `<Suspense>` sınırlarına alındı. `Doctors.tsx` ve `Treatments.tsx` içindeki elle yazılmış tip tanımları ve `as unknown as` dönüşümleri kaldırılarak `createPublicClient()` otomatik tipleri kullanıldı; sorgu hata kontrolleri (`console.error` ve kullanıcıya Türkçe bilgi mesajı), `null` alan kontrolleri, düz `<img>` kullanımı ve `globals.css` tema renkleri (`text-foreground/70`, `bg-background`, `border-secondary`) uygulandı. `package-lock.json` dosyası `origin/main` haline geri alındı.
- **Değişen dosyalar:** `app/(site)/page.tsx`, `components/site/Doctors.tsx`, `components/site/Treatments.tsx`, `logs/ahmetcicek.md`
- **Neden:** PR #29 incelemesinde belirtilen build hatasını ve kod incelemesi maddelerini gidermek.
- **Nasıl test edildi:** `npm run lint` hatasız geçti, `npm run build` başarılı şekilde tamamlandı (`/` rotası Partial Prerender olarak üretildi). Yerelde sunucu başlatılarak `/` sayfası açıldı; Supabase'den gelen 5 aktif doktorun ve 10 aktif tedavinin (ilgili doktor etiketleriyle birlikte) sorunsuz listelendiği doğrulandı.
- **Açık konular:** Yok.
- **Başka ekipten istek:** Yok.

## 2026-11-09 18:32 — Tanıtım sitesi arayüz modernizasyonu ve ZB Dentist marka uyumu (tasks.md 50)
- **Kişi / araç:** Ahmet Çiçek / Antigravity (Gemini)
- **Dal:** feat/site-marka-ve-arayuz
- **Ne yapıldı:** Tanıtım sitesi (`app/(site)/page.tsx` ve `components/site/`) ZB Dentist marka ve tema kurallarına (`rounded-brand`, `border-border`, `bg-whatsapp text-whatsapp-foreground`, `font-bold`) uygun olarak baştan aşağı modernize edildi; `tasks.md` 50. madde kapatıldı. Renkli ve beyaz ZB Dentist logolarını içeren `Header.tsx` ve `Footer.tsx`, kurumsal yaklaşımı tanıtan `AboutSection.tsx`, Supabase'den aktif işlemleri okuyarak WhatsApp randevu mesajı oluşturan `BookingSection.tsx` / `QuickBookingCard.tsx` ve `clinic_settings` ile `working_hours` verilerini listeleyen `ContactFaqSection.tsx` eklendi; `HeroSection.tsx`, `Treatments.tsx` ve `Doctors.tsx` cam efekti (glassmorphism) ve mikro-animasyonlarla güncellendi.
- **Değişen dosyalar:** `app/(site)/page.tsx`, `components/site/Header.tsx`, `components/site/HeroSection.tsx`, `components/site/HeroBackgroundSlider.tsx`, `components/site/AboutSection.tsx`, `components/site/Treatments.tsx`, `components/site/Doctors.tsx`, `components/site/BookingSection.tsx`, `components/site/QuickBookingCard.tsx`, `components/site/ContactFaqSection.tsx`, `components/site/Footer.tsx`, `tasks.md`, `logs/ahmetcicek.md`
- **Neden:** Tanıtım sitesini ZB Dentist kurumsal kimliğine uydurmak (`tasks.md` 50. madde) ve eksik sayfa bölümlerini (Header, Hakkımızda, Hızlı Randevu, İletişim/SSS, Footer) modern ve mobil uyumlu bir tasarımla tamamlamak.
- **Nasıl test edildi:** `npm run lint` ve `npx tsc --noEmit` sıfır hatayla geçti.
- **Açık konular:** Yok.
- **Başka ekipten istek:** Yok.
