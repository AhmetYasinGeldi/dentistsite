# Açık İşler

Açık işler ve PR incelemelerinde çıkan, birleştirmeyi engellemeyen küçük düzeltmeler. Kurallar `AGENTS.md` bölüm 12'de ("Açık işler"):

- Her ekip sadece kendi bölümüne yazar.
- Her madde: başlık, dosya (ve varsa PR numarası), sorun, yapılacak.
- İşi alan kişi kendi dalında düzeltir, aynı dalda maddeyi bu dosyadan siler ve log kaydında hangi maddeyi kapattığını yazar.

Son güncelleme: 7 Kasım 2026 (PR #4, #5, #6, #7, #11, #12, #14, #15, #17, #21, #22, #25, #31, #33 incelemesi)

---

## Panel ekibi (Esma, Merve)

### 27. Durum filtrelerinin gerçek veriyle denenmesi
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #21)
- **Sorun:** "Tamamlandı", "İptal edildi" ve "Reddedildi" filtrelerinde geçmiş randevuların listelendiği, sıralama ve 100 kayıt uyarısı gerçek veriyle doğrulanmadı. Denemede veritabanında eşleşen kayıt olmadığı için ekran boş kaldı.
- **Yapılacak:** Sahte hasta ve geçmiş tarihli randevularla (farklı durumlarda) filtreleri dene, sonucu log'a yaz. Test verisi lazımsa Ahmet Yasin'den iste.

### 35. Geçmiş bekleyen randevu reddinin denenmesi
- **Dosya:** `app/admin/actions.ts` (`rejectAppointmentAction`), `components/admin/appointment-action-notice.tsx` (PR #31)
- **Sorun:** Saati geçmiş bekleyen randevu reddedildiğinde bildirimin atlanması ve "Bildirim gönderilmedi, randevu saati geçmiş" mesajı elle denenmedi. Test verisindeki bekleyen randevuların hepsi ileri tarihli.
- **Yapılacak:** Saati geçmiş bekleyen bir sahte randevuyla reddetmeyi dene; bildirimin gitmediğini ve mesajın göründüğünü log'a yaz. Test verisi lazımsa Ahmet Yasin'den iste.

### 36. Onay kartında odak ve kaydırma
- **Dosya:** `components/admin/appointment-actions.tsx` (onay kartı bloğu) (PR #31)
- **Sorun:** Tab ile odak yalnızca iki buton arasında tutuluyor; kart açıkken arkadaki sayfa kaydırılabiliyor. Kaplama katmanındaki `onKeyDown` içindeki `if` satırları diğer kodla aynı biçimde değil.
- **Yapılacak:** Arka plan kaydırmasını kart açıkken kapat, `onKeyDown` bloğunu düzgün girintile. İstenirse kartı yerleşik `<dialog>` elemanıyla (`showModal()`) yeniden yaz; odak tutma ve Escape tarayıcıdan gelir.

## Bot ekibi (Sevde, Ebru)

### 8. Adım isimlerini `steps.ts` ile eşleştirme
- **Dosya:** `lib/bot/messages.ts` (PR #7)
- **Sorun:** `steps` nesnesindeki anahtarlar Sevde'nin `lib/bot/steps.ts` dosyasıyla aynı olmalı, ancak `steps.ts` henüz main'de yok. İki ayrı listede aynı isimler elle tutulursa zamanla ayrışır.
- **Yapılacak:** `steps.ts` gelince `steps` nesnesinin tipini oradaki adım listesine bağla (ör. `satisfies Partial<Record<Step, string>>`).



### 10. Ebru'nun eski log kayıtları
- **Dosya:** `logs/ebru.md` (PR #7)
- **Not:** İlk iki kayıtta dal `main` ve saat yok; kayıtlar silinmez ama bundan sonraki kayıtlarda saat ve doğru dal yazılmalı. Dosya başlığı (`# Ebru - ...`) eklenebilir.

### 25. Gemini test setinde belirsiz beklentiler ve eksik senaryolar
- **Dosya:** `scripts/gemini-test/dataset.json` (PR #14)
- **Sorun:** id 24 ("17 den sonra uygun musunuz") için `time: "17:00"` bekleniyor; mesaj bir saat değil alt sınır veriyor. id 13 ("diş çekimi") için `Basit Diş Çekimi` bekleniyor; basit mi gömülü mü olduğu belli değil. "menü", geçmiş tarih ("dün"), randevu penceresi dışı tarih ("3 ay sonra") ve saat aralığı ("10-12 arası") senaryoları yok. Dosya sonunda satır sonu yok.
- **Yapılacak:** id 24 ve 13'ün beklenen değerini netleştir (ör. `time: null`, `procedure: null` veya `Muayene`), eksik senaryoları ekle.

### 26. `messages.ts` biçim bozukluğu ve PR #17 log eksikleri
- **Dosya:** `lib/bot/messages.ts`, `logs/ebru.md`, `tasks.md` (PR #17)
- **Sorun:** `errors` içinde `cancelDeadlinePassed` metni girintisiz yazılmış ve `slotTaken` aynı satıra yapışmış. Log kaydında dal `fix bot mesaj parametre isimleri` yazıyor, gerçek dal `fix/bot-mesaj-parametre-isimleri`; parametre adlarının İngilizceye çevrilmesi ve 7. maddenin kapatılması kayıtta yok, sadece 9. madde geçiyor. `tasks.md`'de silinen maddelerin yerinde fazladan boş satırlar kaldı; `logs/ebru.md` sonunda satır sonu yok.
- **Yapılacak:** `cancelDeadlinePassed` metnini 4 boşlukla girintile, `slotTaken`'ı ayrı satıra al. Sonraki log kaydında dal adını doğru yaz, kapatılan tüm maddeleri belirt. Fazla boş satırları sil.

### 32. Akış için eksik metinler
- **Dosya:** `lib/bot/messages.ts`, `lib/bot/flow.ts` (randevu alma akışı PR'ı)
- **Sorun:** Geçersiz ad soyad yazıldığında ayrı bir uyarı metni yok; akış şimdilik soruyu tekrarlıyor. İşlem veya doktor listesi 10'u geçerse kullanılacak "Diğer" satırı için metin yok; akışta geçici olarak `MORE_OPTIONS_TITLE = "Diğer seçenekler"` yazılı.
- **Yapılacak:** Ebru: `errors.invalidName` (ör. "Lütfen adınızı ve soyadınızı birlikte yazar mısınız?") ve `listRows.otherOptions` ekle. Sevde: eklenince `flow.ts`'te kullan, geçici sabiti sil.

## Site ekibi (Ahmet Çiçek, Ebrar)

Açık madde yok.

## Test ekibi (Tuğba, Nezahat)


## Karar verilen konular (Ahmet Yasin, 31 Ekim 2026)

### 14. Panelden erteleme sonrası randevu onaylı olmalı
- **Kim:** Panel ekibi (erteleme özelliği yazılırken). Test ekibi P8'i buna göre günceller.
- **Sorun:** `reschedule_appointment` yeni randevuyu her zaman `pending` açıyor; admin'in ertelediği randevu tekrar onay bekliyor.
- **Karar:** Veritabanı fonksiyonu değişmeyecek. Panel, `reschedule_appointment(..., p_cancelled_by: 'admin')` çağrısından dönen yeni id ile aynı server action içinde randevuyu `approved` yapar, ardından `notifyAppointmentUpdate` çağrılır. Bottan gelen erteleme `pending` kalır.

### 15. Doktor pasifleştirilmeden önce uyarı
- **Kim:** Panel ekibi (doktor yönetimi yazılırken). Test ekibi P9'u buna göre günceller.
- **Sorun:** Doktor pasif yapılınca aktif (`pending`/`approved`, süresi geçmemiş) randevularına ne olacağı belirsizdi.
- **Karar:** Doktorun aktif randevusu varsa panel pasifleştirmeden önce uyarı gösterir ve bu randevuları listeler. Randevular admin tarafından elle iptal edilir veya ertelenir; sistem otomatik iptal yapmaz.
