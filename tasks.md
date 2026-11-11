# Açık İşler

Açık işler ve PR incelemelerinde çıkan, birleştirmeyi engellemeyen küçük düzeltmeler. Kurallar `AGENTS.md` bölüm 12'de ("Açık işler"):

- Her ekip sadece kendi bölümüne yazar.
- Her madde: başlık, dosya (ve varsa PR numarası), sorun, yapılacak.
- İşi alan kişi kendi dalında düzeltir, aynı dalda maddeyi bu dosyadan siler ve log kaydında hangi maddeyi kapattığını yazar.

Son güncelleme: 11 Kasım 2026 (PR #4, #5, #6, #7, #11, #12, #14, #15, #17, #21, #22, #25, #31, #33, #35, #36, #37, #39, #40, #41, #42, #44, #46, #47 incelemesi)

---

## Panel ekibi (Esma, Merve)

### 27. Durum filtrelerinin gerçek veriyle denenmesi
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #21)
- **Sorun:** "Tamamlandı", "İptal edildi" ve "Reddedildi" filtrelerinde geçmiş randevuların listelendiği, sıralama ve 100 kayıt uyarısı gerçek veriyle doğrulanmadı. Denemede veritabanında eşleşen kayıt olmadığı için ekran boş kaldı.
- **Yapılacak:** Sahte hasta ve geçmiş tarihli randevularla (farklı durumlarda) filtreleri dene, sonucu log'a yaz. Test verisi lazımsa Ahmet Yasin'den iste.

## Bot ekibi (Sevde, Ebru)

### 8. Adım isimlerini `steps.ts` ile eşleştirme
- **Dosya:** `lib/bot/messages.ts` (PR #7)
- **Sorun:** `steps` nesnesindeki anahtarlar Sevde'nin `lib/bot/steps.ts` dosyasıyla aynı olmalı, ancak `steps.ts` henüz main'de yok. İki ayrı listede aynı isimler elle tutulursa zamanla ayrışır.
- **Yapılacak:** `steps.ts` gelince `steps` nesnesinin tipini oradaki adım listesine bağla (ör. `satisfies Partial<Record<Step, string>>`).

### 39. Klinik telefonu yokken "kliniği arayın" metni
- **Dosya:** `lib/bot/flow.ts` (`checkChangeAllowed`), `lib/bot/messages.ts` (PR #35)
- **Sorun:** Telefon boşken metin `cancelDeadlinePassed("").replace(/:\s*$/, ".")` ile kırpılıyor. `messages.ts`'teki cümle değişirse (ör. sonu iki nokta ile bitmezse) kırpma sessizce bozulur.
- **Yapılacak:** Ebru: `errors` içine telefonsuz ayrı bir metin ekle (ör. `cancelDeadlinePassedNoPhone`). Sevde: `replace` yerine bu metni kullan.

### 40. Panelden ertelenen randevunun bildirimi
- **Dosya:** `lib/whatsapp/notify.ts` (`buildNotification`) (PR #36 ile ortaya çıktı)
- **Sorun:** Panelden erteleme yeni randevuyu `approved` yapıp `notifyAppointmentUpdate` çağırıyor. Hastaya yalnızca "randevunuz onaylandı" metni gidiyor; randevunun başka saate taşındığı anlaşılmıyor.
- **Yapılacak:** `rescheduled_from` dolu ve `approved` olan randevu için ayrı bir metin kullan (ör. "Randevunuz klinik tarafından 5 Kasım 2026 Perşembe, 10:30 olarak güncellendi."). Fonksiyonun imzası değişmez.

### 43. Fiyat ve sağlık sorularında klinik telefonu
- **Dosya:** `lib/bot/flow.ts` (`handleFreeText`), `lib/bot/messages.ts` (PR #37)
- **Sorun:** Fiyat, adres, sağlık sorusu gibi mesajlar Gemini'den `other` olarak dönüyor ve hastaya "anlayamadım" + menü gidiyor. AGENTS.md 8. bölüm bu sorularda kliniğin telefon numarasının önerilmesini istiyor; hasta sorusunu anlaşılmamış sanıyor.
- **Yapılacak:** Ebru: `messages.ts`'e telefonlu ve telefonsuz bir metin ekle (ör. "Bu konuda bilgi için kliniğimizi arayabilirsiniz: …"). Sevde: serbest metinde `other` gelince "anlayamadım" yerine bu metni (`clinic_settings.phone` ile) gönder, sonra menüyü göster. `intent` listesi değişmez.

### 44. Mesajdan gelen gün kapalıysa veya aralık dışındaysa uyarı metni
- **Dosya:** `lib/bot/flow.ts` (`selectDate`, `goToDates`) (PR #37)
- **Sorun:** Gemini'nin verdiği `date` doğrudan `get_available_slots`'a gidiyor. Gün klinik tatili, doktorun çalışmadığı gün veya `booking_window_days` dışındaysa da hastaya "o gün boş saat kalmadı" deniyor; gün aslında hiç açık değil. Ayrıca `time` alanı ("14 gibi") okunuyor ama akışta kullanılmıyor.
- **Yapılacak:** `hintDate`, `upcomingOpenDates` listesinde yoksa "boş saat kalmadı" yerine "Bu tarihte randevu verilemiyor" gibi bir metinle gün listesini göster (metin Ebru'dan). `time` için şimdilik bir şey yapılmayacaksa PR açıklamasına/log'a not düş; kullanılacaksa o saate en yakın slotu listenin başına almak yeterli.

### 46. Akış metinlerinin `flow.ts`'te kullanılması (32. maddenin Sevde kısmı)
- **Dosya:** `lib/bot/flow.ts`, `lib/bot/messages.ts` (PR #42)
- **Sorun:** PR #42, 32. maddeyi tamamen sildi ama maddenin sadece Ebru kısmı yapıldı. `flow.ts`'te geçici `MORE_OPTIONS_TITLE` sabiti duruyor, `errors.invalidName` ve `listRows.otherOptions` hiçbir yerde kullanılmıyor.
- **Yapılacak:** Sevde: `MORE_OPTIONS_TITLE` yerine `listRows.otherOptions` kullan ve sabiti sil; geçersiz ad soyadda soruyu tekrarlamak yerine `errors.invalidName` gönder.

## Site ekibi (Ahmet Çiçek, Ebrar)

### 52. Hero arka plan görselleri dış kaynaktan ve optimize edilmeden yükleniyor
- **Dosya:** `components/site/HeroBackgroundSlider.tsx` (PR #44)
- **Sorun:** Dört görsel doğrudan `images.unsplash.com` adresinden, 1920 px genişlikte ve `<img>` ile çekiliyor. Mobilde ilk açılış ağırlaşıyor, görseller Unsplash'e bağlı kalıyor. Slayt `prefers-reduced-motion` ayarına bakmadan 5 saniyede bir değişiyor.
- **Yapılacak:** Görselleri (Unsplash lisansıyla) indirip `public/` altına koymak için Ahmet Yasin'e iste ya da sayıyı bire indir; `next/image` ile `sizes` vererek yükle. Sadece ilk görsel öncelikli yüklensin. `motion-reduce:` ile ya da `matchMedia('(prefers-reduced-motion: reduce)')` kontrolüyle geçişi durdur.

### 53. WhatsApp bağlantısı dört dosyada ayrı ayrı üretiliyor
- **Dosya:** `components/site/Header.tsx`, `HeroSection.tsx`, `Footer.tsx`, `BookingSection.tsx` (PR #44)
- **Sorun:** `NEXT_PUBLIC_WHATSAPP_NUMBER` okuma, rakam dışını silme ve `wa.me` adresini kurma kodu dört yerde kopyalanmış. WhatsApp ikonunun SVG yolu da dört kez tekrar ediyor. Biri değişirse diğerleri unutulur.
- **Yapılacak:** `components/site/` altında tek bir yardımcı (ör. `whatsapp-link.ts`: `getWhatsappNumber()`, `buildWhatsappUrl(message)`) ve tek bir `WhatsappIcon` bileşeni yaz, dört dosya bunları kullansın.

### 54. QuickBookingCard'da işlem tipi elle tanımlanmış
- **Dosya:** `components/site/QuickBookingCard.tsx` (PR #44)
- **Sorun:** `ProcedureOption` arayüzü `procedures` tablosunun alanlarını elle yeniden tanımlıyor. `AGENTS.md` bölüm 4 tabloların `lib/database.types.ts`'ten alınmasını istiyor.
- **Yapılacak:** `Pick<Tables<"procedures">, "id" | "name" | "duration_minutes">` kullan.

### 55. Site arayüzünde küçük tutarlılık düzeltmeleri
- **Dosya:** `components/site/Doctors.tsx`, `Header.tsx`, `Footer.tsx`, `Treatments.tsx`, `AboutSection.tsx` (PR #44)
- **Sorun:** Doktor fotoğrafı `h-16 w-16`, baş harf yuvarlağı `h-14 w-14`; kartlar farklı boyda görünüyor. Header'da logo bağlantısı `focus:outline-none` ile klavye odağını gizliyor. Footer'daki WhatsApp butonunda `shadow-sm hover:shadow-md hover:-translate-y-0.5` var, marka kuralı gölge istemiyor ve diğer WhatsApp butonları sadece `hover:opacity-90` kullanıyor. Tedaviler başlığındaki "Toplam N aktif işlem" yazısında "aktif" iç sistem dili. Hakkımızda bölümündeki branş listesi (ortodonti, endodonti, çene cerrahisi) elle yazılmış, veritabanındaki doktorlarla uyuşmayabilir. Mobilde menü bağlantıları tamamen gizli.
- **Yapılacak:** İki yuvarlağı aynı boyuta getir. `focus:outline-none` yerine `focus-visible:outline-2 focus-visible:outline-primary` kullan. Footer butonunu diğerleriyle aynı yap. Metni "Toplam N tedavi" yap. Branş cümlesini genel tut ya da doktor listesinden üret. Mobil menü gerekip gerekmediğine ekipçe karar ver.

### 56. Header mobilde yatay taşma yapıyor olabilir
- **Dosya:** `components/site/Header.tsx` (PR #44)
- **Sorun:** Logo 180 px ve `shrink-0`, WhatsApp butonu da `shrink-0`; `gap-6` ve `px-4` ile birlikte toplam genişlik yaklaşık 410 px. 375 px ve daha dar telefonlarda sayfada yatay kaydırma çıkması bekleniyor (hesapla tespit edildi, tarayıcıda denenmedi). `AGENTS.md` bölüm 10 dar alanda işaret logosunu istiyor.
- **Yapılacak:** `md` altında `/logo/zb-dentist-isaret-renkli.svg`, `md` ve üstünde renkli tam logoyu göster ya da mobilde buton metnini kısalt. 360 px ve 375 px genişlikte yatay kaydırma olmadığını tarayıcıda dene, sonucu log'a yaz.

### 57. PR #44 log kaydında yanlış ve eksik bilgi
- **Dosya:** `logs/ahmetcicek.md` (PR #44)
- **Sorun:** 9 Kasım 18:32 kaydı `HeroSection`, `Treatments` ve `Doctors` bileşenlerinin "cam efekti (glassmorphism) ve mikro-animasyonlarla" güncellendiğini söylüyor, kodda böyle bir şey yok. "Nasıl test edildi" kısmında `npm run build` sonucu ve tarayıcıda deneme yok.
- **Yapılacak:** Eski kaydı değiştirmeden yeni bir kayıt ekle: yapılan değişikliği doğru anlat, `npm run build` sonucunu ve sitenin mobilde ve masaüstünde nasıl denendiğini yaz.

## Test ekibi (Tuğba, Nezahat)

### 61. `senaryolar.md` sonunda satır sonu yok
- **Dosya:** `docs/test/senaryolar.md` (PR #47)
- **Sorun:** 49. madde ve PR açıklaması dosya sonlarına satır sonu eklendiğini söylüyor; `logs/tugba.md`'de var, `senaryolar.md`'de hâlâ yok.
- **Yapılacak:** `senaryolar.md` sonuna satır sonu ekle.

## Karar verilen konular (Ahmet Yasin, 31 Ekim 2026)

### 14. Panelden erteleme sonrası randevu onaylı olmalı
- **Kim:** Panel ekibi (erteleme özelliği yazılırken). Test ekibi P8'i buna göre günceller.
- **Sorun:** `reschedule_appointment` yeni randevuyu her zaman `pending` açıyor; admin'in ertelediği randevu tekrar onay bekliyor.
- **Karar:** Veritabanı fonksiyonu değişmeyecek. Panel, `reschedule_appointment(..., p_cancelled_by: 'admin')` çağrısından dönen yeni id ile aynı server action içinde randevuyu `approved` yapar, ardından `notifyAppointmentUpdate` çağrılır. Bottan gelen erteleme `pending` kalır.

### 15. Doktor pasifleştirilmeden önce uyarı
- **Kim:** Panel ekibi (doktor yönetimi yazılırken). Test ekibi P9'u buna göre günceller.
- **Sorun:** Doktor pasif yapılınca aktif (`pending`/`approved`, süresi geçmemiş) randevularına ne olacağı belirsizdi.
- **Karar:** Doktorun aktif randevusu varsa panel pasifleştirmeden önce uyarı gösterir ve bu randevuları listeler. Randevular admin tarafından elle iptal edilir veya ertelenir; sistem otomatik iptal yapmaz.
