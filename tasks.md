# Açık İşler

Açık işler ve PR incelemelerinde çıkan, birleştirmeyi engellemeyen küçük düzeltmeler. Kurallar `AGENTS.md` bölüm 12'de ("Açık işler"):

- Her ekip sadece kendi bölümüne yazar.
- Her madde: başlık, dosya (ve varsa PR numarası), sorun, yapılacak.
- İşi alan kişi kendi dalında düzeltir, aynı dalda maddeyi bu dosyadan siler ve log kaydında hangi maddeyi kapattığını yazar.

Son güncelleme: 31 Ekim 2026 (PR #4, #5, #6, #7 incelemesi)

---

## Panel ekibi (Esma, Merve)

### 1. Durum filtresindeki metinler ortak eşlemeden gelmeli
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #6)
- **Sorun:** "Durum" açılır listesindeki seçenekler (`Onaylandı`, `İptal Edildi` vb.) elle yazılmış. Ortak eşlemede `İptal edildi` küçük harfle geçiyor; tabloda ve filtrede aynı durum farklı yazılıyor. Sayfadaki `appointmentStatuses` dizisi de `lib/shared/appointment-status.ts` içindeki `APPOINTMENT_STATUSES` listesinin kopyası.
- **Yapılacak:** Seçenekleri `APPOINTMENT_STATUSES` (pending hariç) ve `APPOINTMENT_STATUS_LABELS` üzerinden üret.

### 2. "Diğer randevular" listesine sınır
- **Dosya:** `app/admin/(dashboard)/page.tsx` (PR #6)
- **Sorun:** Filtre seçilmediğinde geçmiş dahil bütün randevular tek seferde çekiliyor. Veri biriktikçe sayfa yavaşlar.
- **Yapılacak:** Varsayılan olarak bugünden itibaren listele veya `.limit()` ile sayfalama ekle.

### 3. Log kaydının güncellenmesi
- **Dosya:** `logs/esmabetul.md` (PR #6)
- **Sorun:** 31 Ekim 15:18 kaydında "lint/build çalıştırılamadı" ve "commit/push edilmedi" yazıyor; PR açıklamasında ise ikisinin de çalıştığı söyleniyor. `lib/shared/appointment-status.ts` değişikliği "Değişen dosyalar" içinde yok.
- **Yapılacak:** Yeni bir kayıtla güncel durumu yaz (eski kayıt değiştirilmez).

### 4. Fazla boş satırlar
- **Dosya:** `lib/shared/appointment-status.ts` (PR #6)
- **Sorun:** `statusLabel` yardımcısından sonra dosyanın sonunda fazladan boş satırlar var.
- **Yapılacak:** Tek satır sonu bırak.

## Bot ekibi (Sevde, Ebru)

### 5. Geçersiz tek mesaj bütün grubu düşürmesin
- **Dosya:** `lib/whatsapp/payload.ts` (PR #5)
- **Sorun:** Bir `change` içindeki mesajlardan birinin `from` alanı geçersizse `messagesValueSchema` bütün değeri reddediyor, aynı gruptaki geçerli mesajlar da işlenmiyor. Pratikte Meta genelde tek mesaj gönderdiği için risk düşük.
- **Yapılacak:** Mesajları tek tek `safeParse` et, sadece geçersiz olanı logla ve atla.

### 6. Log'daki dal adı
- **Dosya:** `logs/sevde.md` (PR #5)
- **Sorun:** Son kayıtta dal `feat/bot-webhook` yazıyor, PR'ın dalı `fix/bot-webhook-inceleme`.
- **Yapılacak:** Sonraki kayıtta doğru dal adını kullan.

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
