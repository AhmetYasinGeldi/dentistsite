# Açık İşler

Açık işler ve PR incelemelerinde çıkan, birleştirmeyi engellemeyen küçük düzeltmeler. Kurallar `AGENTS.md` bölüm 12'de ("Açık işler"):

- Her ekip sadece kendi bölümüne yazar.
- Her madde: başlık, dosya (ve varsa PR numarası), sorun, yapılacak.
- İşi alan kişi kendi dalında düzeltir, aynı dalda maddeyi bu dosyadan siler ve log kaydında hangi maddeyi kapattığını yazar.

Son güncelleme: 1 Kasım 2026 (PR #4, #5, #6, #7, #11, #12, #14, #15 incelemesi)

---

## Panel ekibi (Esma, Merve)

### 23. Durum filtresi seçiliyken geçmiş randevular görünmüyor
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #15)
- **Sorun:** Tarih boşken uygulanan "bugünden itibaren" sınırı durum filtresi seçiliyken de geçerli. "Tamamlandı", "İptal edildi" ve "Reddedildi" filtreleri geçmiş kayıtları göstermiyor; "Tamamlandı" filtresi pratikte hep boş kalır.
- **Yapılacak:** Sınırı yalnızca durum filtresi boşken uygula. Durum seçiliyse en yeni kayıtlar önce gelecek şekilde sırala ve `.limit()` ile üst sınır koy.

### 24. PR #15 log kaydındaki eksikler
- **Dosya:** `logs/esmabetul.md` (PR #15)
- **Sorun:** 31 Ekim 23:42 kaydında dal `feat/admin-appointment-decisions` yazıyor, gerçek dal `feat/admin-appointments-v2`. `lib/shared/appointment-status.ts` "Değişen dosyalar" içinde yok; PR açıklamasında geçen build sonucu log'da yok. Ayrıca PR #15'te kapatılan 1-4 numaralı maddeler `tasks.md`'den silinmemişti (bu güncellemede silindi).
- **Yapılacak:** Sonraki kayıtta dal adını ve değişen dosyaları doğru yaz, kapatılan maddeleri aynı dalda `tasks.md`'den sil.

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

### 25. Gemini test setinde belirsiz beklentiler ve eksik senaryolar
- **Dosya:** `scripts/gemini-test/dataset.json` (PR #14)
- **Sorun:** id 24 ("17 den sonra uygun musunuz") için `time: "17:00"` bekleniyor; mesaj bir saat değil alt sınır veriyor. id 13 ("diş çekimi") için `Basit Diş Çekimi` bekleniyor; basit mi gömülü mü olduğu belli değil. "menü", geçmiş tarih ("dün"), randevu penceresi dışı tarih ("3 ay sonra") ve saat aralığı ("10-12 arası") senaryoları yok. Dosya sonunda satır sonu yok.
- **Yapılacak:** id 24 ve 13'ün beklenen değerini netleştir (ör. `time: null`, `procedure: null` veya `Muayene`), eksik senaryoları ekle.

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
- **Sorun:** `// app/(site)/page.tsx veya app/page.tsx` ve `// components/site/HeroSection.tsx` gibi yapay zekadan kalma yorumlar, satır sonlarında boşluklar, dosya sonunda satır sonu yok; `HeroSection.tsx` 4 boşluk girintili, projenin geri kalanı 2. `page.tsx` içindeki yorumda "Ahmet Çiçek ve Ömer" yazıyor; Ömer projeden ayrıldı, Doktorlar ve Tedaviler bölümleri Ahmet Çiçek'te.
- **Yapılacak:** Yorumları sil (veya Ömer'in adını düzelt), girintiyi 2 boşluğa çek, dosya sonlarına satır sonu ekle.

### 22. Log, dal adı ve `tasks.md` bölümü
- **Dosya:** `logs/ebrar.md`, `tasks.md` (PR #12)
- **Sorun:** Dal adı `ebrar-site-taslak`, kural `feat/site-...` biçiminde. Log'da "Nasıl test edildi" kısmında `npm run lint` ve `npm run build` geçmiyor, dosyanın sonunda satır sonu yok. PR #12'de Panel ekibinin bir maddesi `tasks.md`'den silinmişti; her ekip yalnızca kendi bölümüne yazar.
- **Yapılacak:** Sonraki işlerde `feat/site-...` dalı aç, log'a lint/build sonucunu yaz, `tasks.md`'de sadece Site ekibi bölümünü değiştir.

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
