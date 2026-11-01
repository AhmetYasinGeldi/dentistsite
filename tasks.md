# Açık İşler

Açık işler ve PR incelemelerinde çıkan, birleştirmeyi engellemeyen küçük düzeltmeler. Kurallar `AGENTS.md` bölüm 12'de ("Açık işler"):

- Her ekip sadece kendi bölümüne yazar.
- Her madde: başlık, dosya (ve varsa PR numarası), sorun, yapılacak.
- İşi alan kişi kendi dalında düzeltir, aynı dalda maddeyi bu dosyadan siler ve log kaydında hangi maddeyi kapattığını yazar.

Son güncelleme: 31 Ekim 2026 (PR #4, #5, #6, #7, #11, #12 incelemesi)

---

## Panel ekibi (Esma, Merve)

### 1. Durum filtresindeki metinler ortak eşlemeden gelmeli
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #6)
- **Sorun:** "Durum" açılır listesindeki seçenekler (`Onaylandı`, `İptal Edildi` vb.) elle yazılmış. Ortak eşlemede `İptal edildi` küçük harfle geçiyor; tabloda ve filtrede aynı durum farklı yazılıyor. Sayfadaki `appointmentStatuses` dizisi de `lib/shared/appointment-status.ts` içindeki `APPOINTMENT_STATUSES` listesinin kopyası.
- **Yapılacak:** Seçenekleri `APPOINTMENT_STATUSES` (pending hariç) ve `APPOINTMENT_STATUS_LABELS` üzerinden üret.

### 3. Log kaydının güncellenmesi
- **Dosya:** `logs/esmabetul.md` (PR #6)
- **Sorun:** 31 Ekim 15:18 kaydında "lint/build çalıştırılamadı" ve "commit/push edilmedi" yazıyor; PR açıklamasında ise ikisinin de çalıştığı söyleniyor. `lib/shared/appointment-status.ts` değişikliği "Değişen dosyalar" içinde yok.
- **Yapılacak:** Yeni bir kayıtla güncel durumu yaz (eski kayıt değiştirilmez).

### 4. Fazla boş satırlar
- **Dosya:** `lib/shared/appointment-status.ts` (PR #6)
- **Sorun:** `statusLabel` yardımcısından sonra dosyanın sonunda fazladan boş satırlar var.
- **Yapılacak:** Tek satır sonu bırak.

## Bot ekibi (Sevde, Ebru)

### 7. `messages.ts` içindeki Türkçe değişken adları
- **Dosya:** `lib/bot/messages.ts` (PR #7)
- **Sorun:** Parametre adları Türkçe (`islem`, `doktor`, `tarihSaat`, `durum`, `klinikTelefonu`, `yeniTarihSaat`). AGENTS.md'ye göre kod içi isimler İngilizce olmalı. Ayrıca dosyanın sonunda satır sonu yok.
- **Yapılacak:** `procedure`, `doctor`, `dateTime`, `status`, `clinicPhone`, `newDateTime` olarak değiştir.

### 8. Adım isimlerini `steps.ts` ile eşleştirme
- **Dosya:** `lib/bot/messages.ts` (PR #7)
- **Sorun:** `steps` nesnesindeki anahtarlar Sevde'nin `lib/bot/steps.ts` dosyasıyla aynı olmalı, ancak `steps.ts` henüz main'de yok. İki ayrı listede aynı isimler elle tutulursa zamanla ayrışır.
- **Yapılacak:** `steps.ts` gelince `steps` nesnesinin tipini oradaki adım listesine bağla (ör. `satisfies Partial<Record<Step, string>>`).

### 9. İptal süresi mesajı erteleme için de kullanılacak
- **Dosya:** `lib/bot/messages.ts` (PR #7)
- **Sorun:** `cancelDeadlinePassed` metni "İptal süresi geçtiği için" diyor; aynı kural erteleme için de geçerli.
- **Yapılacak:** "Randevunuza az süre kaldığı için iptal veya erteleme işlemini buradan yapamıyoruz." gibi iki durumu da kapsayan bir metin.

### 10. Ebru'nun eski log kayıtları
- **Dosya:** `logs/ebru.md` (PR #7)
- **Not:** İlk iki kayıtta dal `main` ve saat yok; kayıtlar silinmez ama bundan sonraki kayıtlarda saat ve doğru dal yazılmalı. Dosya başlığı (`# Ebru - ...`) eklenebilir.

### 16. Boş oturum için paylaşılan nesne
- **Dosya:** `lib/bot/session.ts` (PR #11)
- **Sorun:** `getSession` kayıt yokken veya hata olduğunda hep aynı `EMPTY_SESSION` nesnesini döndürüyor; `{ ...EMPTY_SESSION }` kopyasında da `context` aynı `{}` nesnesi. Akış kodu `session.context.date = ...` gibi doğrudan değiştirirse değer sabite yazılır ve sonraki hastaların oturumuna sızar.
- **Yapılacak:** Sabit yerine her çağrıda yeni nesne döndüren `emptySession()` fonksiyonu kullan.

### 17. `setSession` satır yoksa sessizce hiçbir şey yapmıyor
- **Dosya:** `lib/bot/session.ts` (PR #11)
- **Sorun:** `setSession` sadece `update` yapıyor. `touchSession` hata verip satır oluşmadıysa güncelleme 0 satırı etkiler, hata da dönmez; hasta aynı adımda takılır ve log'da iz kalmaz.
- **Yapılacak:** `update` yerine `upsert({ phone, step, context }, { onConflict: "phone" })` kullan veya `.select("phone")` ile dönen satır sayısını kontrol edip 0 ise logla.

### 18. `slotStart` doğrulaması gevşek
- **Dosya:** `lib/bot/session.ts` (PR #11)
- **Sorun:** `slotStart: z.string()` her metni kabul ediyor. Bu değer randevu oluşturmada ve `reschedule_appointment` çağrısında kullanılacak; bozuk bir değer veritabanı hatasına kadar fark edilmez.
- **Yapılacak:** zod'un saat dilimi (offset) içeren datetime doğrulamasını kullan (ör. `2026-11-05T10:30:00+03:00` geçmeli).

## Site ekibi (Ahmet Çiçek, Ebrar)

### 19. Hero metni gerçek akışla uyuşmuyor
- **Dosya:** `components/site/HeroSection.tsx` (PR #12)
- **Sorun:** "Saniyeler içinde randevunuzu oluşturun" yazıyor; oysa bottan gelen randevu `pending` açılır ve klinik onayını bekler. "Ağrısız diş tedavileri" ifadesi de tıbbi bir vaat; "modern, güvenilir" gibi kalıp ifadeler metni sıradanlaştırıyor.
- **Yapılacak:** Metni "WhatsApp'tan yazın, randevu talebiniz kliniğe iletilsin" gibi gerçek akışa uygun ve vaat içermeyen bir cümleyle değiştir.

### 20. WhatsApp numarası tanımlı değilse bozuk link
- **Dosya:** `components/site/HeroSection.tsx` (PR #12)
- **Sorun:** `NEXT_PUBLIC_WHATSAPP_NUMBER` boşsa `|| ''` ile `https://wa.me/?text=...` gibi numarasız bir link üretiliyor, hata fark edilmiyor.
- **Yapılacak:** Numara yoksa sunucu log'una uyarı yaz ve butonu gösterme (veya pasif göster).

### 21. Dosya biçimi ve artık yorumlar
- **Dosya:** `app/(site)/page.tsx`, `components/site/HeroSection.tsx` (PR #12)
- **Sorun:** `// app/(site)/page.tsx veya app/page.tsx` ve `// components/site/HeroSection.tsx` gibi yapay zekadan kalma yorumlar, satır sonlarında boşluklar, dosya sonunda satır sonu yok; `HeroSection.tsx` 4 boşluk girintili, projenin geri kalanı 2.
- **Yapılacak:** Yorumları sil, girintiyi 2 boşluğa çek, dosya sonlarına satır sonu ekle.

### 22. Log ve dal adı
- **Dosya:** `logs/ebrar.md` (PR #12)
- **Sorun:** Dal adı `ebrar-site-taslak`, kural `feat/site-...` biçiminde. Log'da `package-lock.json` değişen dosyalarda yok, "Nasıl test edildi" kısmında `npm run lint` ve `npm run build` geçmiyor, dosyanın sonunda satır sonu yok. PR açıklaması boş.
- **Yapılacak:** Sonraki işlerde `feat/site-...` dalı aç, log'a lint/build sonucunu yaz, PR açıklamasına ne yapıldığını ve nasıl test edildiğini ekle.

## Test ekibi (Tuğba, Nezahat)

### 11. Dosya adı yazım hatası
- **Dosya:** `docs/test/senarolar.md` (PR #4)
- **Sorun:** Dosya adı `senarolar.md`, PR açıklamasında ve log'da `senaryolar.md`.
- **Yapılacak:** `git mv docs/test/senarolar.md docs/test/senaryolar.md`.

### 12. Kurallarda olmayan beklentiler
- **Dosya:** `docs/test/senarolar.md` (PR #4)
- **Sorun:**
  - P4: "Sebep boş bırakılırsa işlem engellenir" — `rejection_reason` sütunu boş bırakılabilir, AGENTS.md'de zorunlu değil.
  - P8: Panelden erteleme sonrası yeni randevunun durumu yazılmamış. `reschedule_appointment` yeni randevuyu her zaman `pending` açıyor; panelden ertelenen randevu da tekrar onay bekleyecek.
  - B12: Resim gelince ne olacağı AGENTS.md'de tanımlı değil; beklenen sonuç bot ekibiyle netleştirilmeli.
- **Yapılacak:** Bu maddeleri "netleştirilecek" olarak işaretle veya gerçek kurala göre düzelt.

### 13. Log'da yarım cümle
- **Dosya:** `logs/tugba.md` (PR #4)
- **Sorun:** "Ne yapıldı" maddesi "P1 ve P2 senaryoları" diye yarım kalmış.
- **Yapılacak:** Sonraki kayıtta düzelt.

## Karar verilen konular (Ahmet Yasin, 31 Ekim 2026)

### 14. Panelden erteleme sonrası randevu onaylı olmalı
- **Kim:** Panel ekibi (erteleme özelliği yazılırken). Test ekibi P8'i buna göre günceller.
- **Sorun:** `reschedule_appointment` yeni randevuyu her zaman `pending` açıyor; admin'in ertelediği randevu tekrar onay bekliyor.
- **Karar:** Veritabanı fonksiyonu değişmeyecek. Panel, `reschedule_appointment(..., p_cancelled_by: 'admin')` çağrısından dönen yeni id ile aynı server action içinde randevuyu `approved` yapar, ardından `notifyAppointmentUpdate` çağrılır. Bottan gelen erteleme `pending` kalır.

### 15. Doktor pasifleştirilmeden önce uyarı
- **Kim:** Panel ekibi (doktor yönetimi yazılırken). Test ekibi P9'u buna göre günceller.
- **Sorun:** Doktor pasif yapılınca aktif (`pending`/`approved`, süresi geçmemiş) randevularına ne olacağı belirsizdi.
- **Karar:** Doktorun aktif randevusu varsa panel pasifleştirmeden önce uyarı gösterir ve bu randevuları listeler. Randevular admin tarafından elle iptal edilir veya ertelenir; sistem otomatik iptal yapmaz.
