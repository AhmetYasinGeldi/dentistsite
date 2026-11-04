# Açık İşler

Açık işler ve PR incelemelerinde çıkan, birleştirmeyi engellemeyen küçük düzeltmeler. Kurallar `AGENTS.md` bölüm 12'de ("Açık işler"):

- Her ekip sadece kendi bölümüne yazar.
- Her madde: başlık, dosya (ve varsa PR numarası), sorun, yapılacak.
- İşi alan kişi kendi dalında düzeltir, aynı dalda maddeyi bu dosyadan siler ve log kaydında hangi maddeyi kapattığını yazar.

Son güncelleme: 4 Kasım 2026 (PR #4, #5, #6, #7, #11, #12, #14, #15, #17, #21, #22, #25 incelemesi)

---

## Panel ekibi (Esma, Merve)

### 30. Randevu işlem tablosunda küçük düzeltmeler
- **Dosya:** `app/admin/(dashboard)/page.tsx`, `app/admin/actions.ts` (PR #25)
- **Sorun:** Tabloda iki tane "İşlem" başlığı var. İşlemden sonra seçili filtreler kayboluyor, sayfa yenilenince uyarı tekrar görünüyor. Butonlar çift tıklamaya karşı korunmuyor; ikinci istek "Randevu durumu değişmiş" uyarısı gösteriyor.
- **Yapılacak:** Buton sütununu "İşlemler" olarak adlandır. Yönlendirmede mevcut filtreleri koru. Gönderim sırasında butonu devre dışı bırak (`useFormStatus`).

### 31. Geçmiş randevularda işlem butonları
- **Dosya:** `app/admin/(dashboard)/page.tsx`, `app/admin/actions.ts` (PR #25)
- **Sorun:** Saati geçmiş onaylı randevularda "İptal Et" görünüyor; basılırsa hastaya geçmiş tarih için iptal mesajı gidiyor. Saati geçmiş bekleyen randevu da onaylanabiliyor.
- **Yapılacak:** Saati geçmiş randevularda iptal ve onay butonlarını gösterme, server action'da da `starts_at > now` koşulu ekle.

### 27. Durum filtrelerinin gerçek veriyle denenmesi
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #21)
- **Sorun:** "Tamamlandı", "İptal edildi" ve "Reddedildi" filtrelerinde geçmiş randevuların listelendiği, sıralama ve 100 kayıt uyarısı gerçek veriyle doğrulanmadı. Denemede veritabanında eşleşen kayıt olmadığı için ekran boş kaldı.
- **Yapılacak:** Sahte hasta ve geçmiş tarihli randevularla (farklı durumlarda) filtreleri dene, sonucu log'a yaz. Test verisi lazımsa Ahmet Yasin'den iste.

## Bot ekibi (Sevde, Ebru)

### 8. Adım isimlerini `steps.ts` ile eşleştirme
- **Dosya:** `lib/bot/messages.ts` (PR #7)
- **Sorun:** `steps` nesnesindeki anahtarlar Sevde'nin `lib/bot/steps.ts` dosyasıyla aynı olmalı, ancak `steps.ts` henüz main'de yok. İki ayrı listede aynı isimler elle tutulursa zamanla ayrışır.
- **Yapılacak:** `steps.ts` gelince `steps` nesnesinin tipini oradaki adım listesine bağla (ör. `satisfies Partial<Record<Step, string>>`).



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

### 26. `messages.ts` biçim bozukluğu ve PR #17 log eksikleri
- **Dosya:** `lib/bot/messages.ts`, `logs/ebru.md`, `tasks.md` (PR #17)
- **Sorun:** `errors` içinde `cancelDeadlinePassed` metni girintisiz yazılmış ve `slotTaken` aynı satıra yapışmış. Log kaydında dal `fix bot mesaj parametre isimleri` yazıyor, gerçek dal `fix/bot-mesaj-parametre-isimleri`; parametre adlarının İngilizceye çevrilmesi ve 7. maddenin kapatılması kayıtta yok, sadece 9. madde geçiyor. `tasks.md`'de silinen maddelerin yerinde fazladan boş satırlar kaldı; `logs/ebru.md` sonunda satır sonu yok.
- **Yapılacak:** `cancelDeadlinePassed` metnini 4 boşlukla girintile, `slotTaken`'ı ayrı satıra al. Sonraki log kaydında dal adını doğru yaz, kapatılan tüm maddeleri belirt. Fazla boş satırları sil.

### 29. Red bildiriminde red sebebi yok
- **Dosya:** `lib/whatsapp/notify.ts`, `lib/bot/messages.ts` (PR #22)
- **Sorun:** Panelde girilen `rejection_reason` hastaya giden red mesajına eklenmiyor; `messages.ts`'teki red metninde sebep için yer yok.
- **Yapılacak:** Red metnine isteğe bağlı sebep parametresi ekle; `rejection_reason` doluysa mesajda göster, boşsa mevcut metin kalsın.

## Site ekibi (Ahmet Çiçek, Ebrar)

Açık madde yok.

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
