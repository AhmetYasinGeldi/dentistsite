# Açık İşler

Açık işler ve PR incelemelerinde çıkan, birleştirmeyi engellemeyen küçük düzeltmeler. Kurallar `AGENTS.md` bölüm 12'de ("Açık işler"):

- Her ekip sadece kendi bölümüne yazar.
- Her madde: başlık, dosya (ve varsa PR numarası), sorun, yapılacak.
- İşi alan kişi kendi dalında düzeltir, aynı dalda maddeyi bu dosyadan siler ve log kaydında hangi maddeyi kapattığını yazar.

Son güncelleme: 9 Kasım 2026 (PR #4, #5, #6, #7, #11, #12, #14, #15, #17, #21, #22, #25, #31, #33, #35, #36, #37, #39, #40, #41, #42 incelemesi)

---

## Panel ekibi (Esma, Merve)

### 27. Durum filtrelerinin gerçek veriyle denenmesi
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #21)
- **Sorun:** "Tamamlandı", "İptal edildi" ve "Reddedildi" filtrelerinde geçmiş randevuların listelendiği, sıralama ve 100 kayıt uyarısı gerçek veriyle doğrulanmadı. Denemede veritabanında eşleşen kayıt olmadığı için ekran boş kaldı.
- **Yapılacak:** Sahte hasta ve geçmiş tarihli randevularla (farklı durumlarda) filtreleri dene, sonucu log'a yaz. Test verisi lazımsa Ahmet Yasin'den iste.

### 41. Saati geçmiş randevu iptalinde bildirim
- **Dosya:** `app/admin/actions.ts` (`cancelAppointmentAction`) (PR #36)
- **Sorun:** `starts_at` kontrolü kaldırıldığı için panel artık saati geçmiş aktif randevuyu da iptal edebiliyor. Bu durumda hastaya "klinik randevunuzu iptal etti" mesajı gidiyor; geçmiş bir randevu için anlamsız.
- **Yapılacak:** Red işlemindeki gibi randevu saati geçmişse `notifyAndRefresh(..., "past")` ile bildirimi atla ve "randevu saati geçmiş" uyarısını göster.

### 42. Erteleme hata mesajlarının denenmesi
- **Dosya:** `app/admin/actions.ts` (`rescheduleAppointmentAction`), `components/admin/appointment-action-notice.tsx` (PR #36)
- **Sorun:** 23P01 / RD004 (saat doldu) ve RD003 (randevu artık aktif değil) mesajları elle tetiklenmedi.
- **Yapılacak:** İki sekmede aynı randevunun erteleme penceresini aç, birinde saati seç ve ertele, diğerinde aynı saati seç: RD003 mesajını gör. Başka bir randevuyu bir sekmede seçilen saate ertele, diğerinde aynı saati seç: RD004 veya 23P01 mesajını gör. Sonucu log'a yaz.

### 35. Geçmiş bekleyen randevu reddinin denenmesi
- **Dosya:** `app/admin/actions.ts` (`rejectAppointmentAction`), `components/admin/appointment-action-notice.tsx` (PR #31)
- **Sorun:** Saati geçmiş bekleyen randevu reddedildiğinde bildirimin atlanması ve "Bildirim gönderilmedi, randevu saati geçmiş" mesajı elle denenmedi. Test verisindeki bekleyen randevuların hepsi ileri tarihli.
- **Yapılacak:** Saati geçmiş bekleyen bir sahte randevuyla reddetmeyi dene; bildirimin gitmediğini ve mesajın göründüğünü log'a yaz. Test verisi lazımsa Ahmet Yasin'den iste.

### 51. Panelde ZB Dentist logosu ve renk kontrolü
- **Dosya:** `app/admin/`, `components/admin/` (marka PR'ı)
- **Sorun:** Tema ZB Dentist'e geçti: `primary` petrol, `accent` gün batımı (turuncu), `muted`/`secondary` nane yeşili oldu. Onay bekleyen kutusu (`border-accent bg-accent/10`) artık turuncu görünüyor. Panelde logo yok.
- **Yapılacak:** Paneli açıp ekranları kontrol et; okunmayan veya bozuk görünen yer varsa ortak renk adlarıyla düzelt (hex yazma). Giriş sayfasına ve üst/kenar çubuğuna `/logo/zb-dentist-isaret-renkli.svg` veya yatay logoyu ekle. Kurallar `AGENTS.md` bölüm 10, "Marka ve tema".

## Bot ekibi (Sevde, Ebru)

### 8. Adım isimlerini `steps.ts` ile eşleştirme
- **Dosya:** `lib/bot/messages.ts` (PR #7)
- **Sorun:** `steps` nesnesindeki anahtarlar Sevde'nin `lib/bot/steps.ts` dosyasıyla aynı olmalı, ancak `steps.ts` henüz main'de yok. İki ayrı listede aynı isimler elle tutulursa zamanla ayrışır.
- **Yapılacak:** `steps.ts` gelince `steps` nesnesinin tipini oradaki adım listesine bağla (ör. `satisfies Partial<Record<Step, string>>`).

### 25. Gemini test setinde belirsiz beklentiler ve eksik senaryolar
- **Dosya:** `scripts/gemini-test/dataset.json` (PR #14)
- **Sorun:** id 24 ("17 den sonra uygun musunuz") için `time: "17:00"` bekleniyor; mesaj bir saat değil alt sınır veriyor. id 13 ("diş çekimi") için `Basit Diş Çekimi` bekleniyor; basit mi gömülü mü olduğu belli değil. "menü", geçmiş tarih ("dün"), randevu penceresi dışı tarih ("3 ay sonra") ve saat aralığı ("10-12 arası") senaryoları yok. Dosya sonunda satır sonu yok.
- **Yapılacak:** id 24 ve 13'ün beklenen değerini netleştir (ör. `time: null`, `procedure: null` veya `Muayene`), eksik senaryoları ekle.
- **Durum:** PR #39'da yapıldı ama o PR 68 vakanın 21'ini (id 48-68) sildiği için değişiklik istendi. Silinen vakalar geri konunca ve 45. madde de yapılınca birleşecek.

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

### 45. Gemini test setinde iki beklenen değer
- **Dosya:** `scripts/gemini-test/dataset.json` (PR #39, açık)
- **Sorun:** PR #39'da eklenen vakalardan id 50 ("3 ay sonra için randevu alabiliyor muyuz") için `intent: "other"` bekleniyor; `lib/ai/intent.ts`'teki tanıma göre müsaitlik soran mesaj `book`, `date: null` olmalı (pencere dışı olduğuna Gemini değil kod karar verir). id 48 ("menü") Gemini'ye hiç gitmiyor; `flow.ts` bu kelimeyi önce yakalıyor, bu vaka botun gerçek davranışını ölçmüyor. Dosya sonunda satır sonu hâlâ yok.
- **Yapılacak:** PR #39'u düzeltirken bunu da yap: id 50'yi `book` yap. "menü" vakasını sil ya da yerine "ana sayfaya dönmek istiyorum" gibi Gemini'ye giden bir mesaj koy. Dosya sonuna satır sonu ekle. Silinen 21 vaka geri gelince id'ler değişeceği için yeni vakaları sona ekle.

### 46. Akış metinlerinin `flow.ts`'te kullanılması (32. maddenin Sevde kısmı)
- **Dosya:** `lib/bot/flow.ts`, `lib/bot/messages.ts` (PR #42)
- **Sorun:** PR #42, 32. maddeyi tamamen sildi ama maddenin sadece Ebru kısmı yapıldı. `flow.ts`'te geçici `MORE_OPTIONS_TITLE` sabiti duruyor, `errors.invalidName` ve `listRows.otherOptions` hiçbir yerde kullanılmıyor.
- **Yapılacak:** Sevde: `MORE_OPTIONS_TITLE` yerine `listRows.otherOptions` kullan ve sabiti sil; geçersiz ad soyadda soruyu tekrarlamak yerine `errors.invalidName` gönder.

### 47. Ebru'nun PR #40-#42 log kayıtları
- **Dosya:** `logs/ebru.md` (PR #40, #41, #42; açık PR #39)
- **Sorun:** PR #40 kaydı 26. maddeyi kapattığını yazmıyor, "Biçim bozuluğu" yazım hatası var. PR #42 kaydında kişi "Ebrar / Claude" yazıyor (Ebrar site ekibinde) ve 32. madde geçmiyor. PR #41 için log kaydı yok, 10. maddenin kapatıldığı hiçbir kayıtta geçmiyor. Dosya sonunda satır sonu yine yok.
- **Yapılacak:** Sonraki kayıtta bu PR'larda kapatılan maddeleri (10, 26, 32) ve kişi adını düzelt, dosya sonuna satır sonu ekle. PR #39'daki kaydın başlığını da düzelt: `2026.11.08 20.35` yerine `2026-11-08 20:35`.

## Site ekibi (Ahmet Çiçek, Ebrar)

Açık madde yok.

## Test ekibi (Tuğba, Nezahat)

### 48. PR #33 log kayıtlarında kalan yer tutucular
- **Dosya:** `logs/tugba.md` (PR #33)
- **Sorun:** 6 Kasım kaydının "Açık konular" maddesinde `[sebep, ör. ikinci numara yok, ...]`, 7 Kasım kaydının "Nasıl test edildi" maddesinde `[lint ve build çalıştırdıysan sonucu yaz, ...]` yer tutucusu duruyor. 8 Kasım kaydı yer tutucuların doldurulduğunu söylüyor.
- **Yapılacak:** Sonraki kayıtta bu iki yer tutucunun yerine geçen bilgiyi yaz (eski kayıtları değiştirme).

### 49. B7 ve B9 sonucunda "bildirim gönderilemedi" ifadesi
- **Dosya:** `docs/test/senaryolar.md`, `logs/tugba.md` (PR #33)
- **Sorun:** B7 (iptal) ve B9 (erteleme) bottan yapılan işlemler; hasta cevabı sohbette doğrudan alır, `notifyAppointmentUpdate` ve panelin "bildirim gönderilemedi" uyarısı bu senaryolarda devreye girmez. Log'da "panel bildirim gönderilemedi uyarısı gösterdi" yazıyor; neyin denendiği belli değil. Dosya sonunda satır sonu hâlâ yok.
- **Yapılacak:** B7/B9'u tekrar dene: bot iptal/erteleme sonrası sohbette onay mesajı gönderdi mi, veritabanında durum doğru mu, bunları ayrı ayrı yaz. Panelden yapılan iptal/onay bildirim hatası P3/P7 satırında kalsın. Dosya sonuna satır sonu ekle.

## Karar verilen konular (Ahmet Yasin, 31 Ekim 2026)

### 14. Panelden erteleme sonrası randevu onaylı olmalı
- **Kim:** Panel ekibi (erteleme özelliği yazılırken). Test ekibi P8'i buna göre günceller.
- **Sorun:** `reschedule_appointment` yeni randevuyu her zaman `pending` açıyor; admin'in ertelediği randevu tekrar onay bekliyor.
- **Karar:** Veritabanı fonksiyonu değişmeyecek. Panel, `reschedule_appointment(..., p_cancelled_by: 'admin')` çağrısından dönen yeni id ile aynı server action içinde randevuyu `approved` yapar, ardından `notifyAppointmentUpdate` çağrılır. Bottan gelen erteleme `pending` kalır.

### 15. Doktor pasifleştirilmeden önce uyarı
- **Kim:** Panel ekibi (doktor yönetimi yazılırken). Test ekibi P9'u buna göre günceller.
- **Sorun:** Doktor pasif yapılınca aktif (`pending`/`approved`, süresi geçmemiş) randevularına ne olacağı belirsizdi.
- **Karar:** Doktorun aktif randevusu varsa panel pasifleştirmeden önce uyarı gösterir ve bu randevuları listeler. Randevular admin tarafından elle iptal edilir veya ertelenir; sistem otomatik iptal yapmaz.
