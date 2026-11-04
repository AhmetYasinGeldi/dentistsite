## 2026-11-05 — Doktorlar ve tedaviler bölümü
- **Kişi / araç:** Ahmet Çiçek / Gemini
- **Dal:** feat/doktorlar-tedaviler
- **Ne yapıldı:** Veritabanından doktorlar ve tedaviler verisini çekerek listeleyen `Doctors.tsx` ve `Treatments.tsx` bileşenleri oluşturuldu. Aktiflik (`is_active`) kontrolü eklendi. Bu bileşenler `page.tsx` içinde birleştirildi.
- **Değişen dosyalar:** `app/(site)/page.tsx`, `components/site/Doctors.tsx`, `components/site/Treatments.tsx`
- **Neden:** Ziyaretçilerin hekim kadrosunu ve sunulan tedavi seçeneklerini görebilmesi için.
- **Nasıl test edildi:** Kodlar oluşturuldu, Supabase çevresel değişkenleri bekleniyor.
- **Açık konular:** .env.local bilgileri girildikten sonra veri akışı kontrol edilecek.
- **Başka ekipten istek:** Yok.