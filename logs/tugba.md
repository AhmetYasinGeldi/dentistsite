# Tuğba - Test Günlüğü

## 2026-10-30 23:10 — Bot, panel ve site test senaryoları
- **Kişi / araç:** Tuğba / Claude (web sohbeti), VS Code
- **Dal:** test-tugba
- **Ne yapıldı:** Projeyi yerel ortama kurdum. `AGENTS.md` ve `README.md`'yi okuyup bot (14), panel (11) ve site (4) için test senaryolarını yazdım. Her senaryoda adımlar ve beklenen sonuç var; beklenen sonuçları `AGENTS.md`'deki kurallara göre hazırladım. P1 ve P2 senaryoları denendi.
- **Değişen dosyalar:** `docs/test/senaryolar.md`, `logs/tugba.md`
- **Neden:** Trello Test panosundaki "Test senaryoları" kartı. Sistem parçaları hazır oldukça aynı senaryolarla tutarlı test yapabilmek.
- **Nasıl test edildi:** Doküman olduğu için çalıştırılacak kod yok. Senaryoları `AGENTS.md` ve `supabase/01_schema.sql` ile karşılaştırdım (örneğin iptal sınırı `cancel_limit_hours` varsayılanı 2 saat, slot süresi en fazla 30 dakika). Yerel ortamda P1 (giriş/çıkış) ve P2 (girişsiz /admin) denendi: giriş çalışıyor, çıkıştan sonra geri tuşu panel verisini göstermiyor, siteye yönlendiriyor. Diğer senaryolar sistem hazır oldukça denenecek.
- **Açık konular:** Doktor pasifleştirilince mevcut randevulara ne olacağı `AGENTS.md`'de yazmıyor (P9); Panel ekibiyle netleştirilmeli. Senaryolar henüz uygulanmadı, sistem hazır oldukça denenecek.
- **Başka ekipten istek:** Yok.

## 6 Kasım 2026 23:45 — Tuğba Aslan

- **Kişi / araç:** Tuğba / Claude (web sohbeti)
- **Dal:** test-tugba
- **Ne yapıldı:** Canlı sistemde kayıtlı test numarasıyla bot (B1, B2, B3, B5, B6, B7, B9, B10, B11, B12) ve panel (P1, P2, P3, P5, P7) senaryolarını denedim, sonuçları `senaryolar.md`'de işaretledim. B1, B2, B3, B5, B6, B10, B11, B12, P1 ve P2 beklenen sonucu verdi. B7 ve B9'da butonlar işlem yapmıyor, P3 ve P7'de randevu durumu değişiyor ama hastaya bildirim gönderilemiyor, P5'te elle randevu özelliği yok. Bulunan hatalar için Test panosunda kart açtım.
- **Değişen dosyalar:** `docs/test/senaryolar.md`, `logs/tugba.md`
- **Neden:** Trello Test panosundaki bot ve panel test kartları.
- **Nasıl test edildi:** Canlı sistemde test numarasından WhatsApp'ta bota yazarak ve canlı panelde giriş yaparak. Bildirim testleri hastanın son mesajından sonraki 24 saat içinde yapıldı.
- **Açık konular:** B4, B8, B13, B14, P4, P6 ve P8-P11 denenmedi: [sebep, ör. ikinci numara yok, B8'in test yolu belirsiz, özellik yok]. B12'de botun verdiği cevap AGENTS.md'de tanımlı değil, bot ekibiyle netleştirilecek.
- **Başka ekipten istek:** Bot ekibi: B7 ve B9 (iptal, erteleme). Panel/Bot ekibi: bildirim gönderimi (P3, P7). Panel ekibi: elle randevu ekleme (P5, P6).

## 2026-11-07 23:58 — Açık işler 12, 13, 37, 38 kapatıldı
- **Kişi / araç:** Tuğba / Claude (web sohbeti)
- **Dal:** test-tugba
- **Ne yapıldı:** Açık işler listesindeki 12, 13, 37 ve 38. maddeleri kapattım ve `tasks.md`'den sildim. `senaryolar.md`'de P4 beklenen sonucunu (red sebebi isteğe bağlı), P8'i (erteleme sonrası yeni randevu aynı işlemde `approved`) ve B12'yi ("netleştirilecek") düzelttim. Sonuç tablosunda B12 notuna botun cevabını yazdım, B7 ve B9'u "Kaldı"dan "Denenemedi (özellik henüz yok)"e çevirdim, P8-P11'i ayrı satırlara böldüm, S1 sonucunu ekledim. 6 Kasım kaydındaki "P5 denendi" ifadesi yanlıştı: P5 denenmedi, panelde elle randevu özelliği yok. Başlık formatını AGENTS.md'ye uydurdum.
- **Değişen dosyalar:** `docs/test/senaryolar.md`, `logs/tugba.md`, `tasks.md`
- **Neden:** Açık işler listesi: PR #4 incelemesi (12, 13), PR #33 incelemesi (37, 38).
- **Nasıl test edildi:** Doküman değişikliği, çalıştırılacak kod yok. [lint ve build çalıştırdıysan sonucu yaz, çalıştırmadıysan bu cümleyi sil]
- **Açık konular:** B4 (ikinci kayıtlı numara gerekiyor), B8, B13, B14, P4, P6, P8-P11 ve S2-S4 denenmedi. B7 ve B9 işleyicileri yazılınca tekrar denenecek. B12'de resim cevabının nasıl olacağı bot ekibiyle netleştirilecek.
- **Başka ekipten istek:** Yok.

## 2026-11-08 21:40 — B7 ve B9 tekrar denendi, inceleme düzeltmeleri
- **Kişi / araç:** Tuğba / Claude (web sohbeti)
- **Dal:** test-tugba
- **Ne yapıldı:** Canlı sistemde B7 (iptal) ve B9 (erteleme) senaryolarını tekrar denedim. İptal ve erteleme işlemleri çalıştı, ancak panel "bildirim gönderilemedi" uyarısı gösterdi. Sonuç tablosunda B7 ve B9 satırlarını ve sebep sütunlarını güncelledim. Ahmet Yasin'in PR incelemesindeki iki isteği yaptım: P8'in beklenen sonucunu düzelttim (eski randevu iptal, yeni randevu "Onaylandı", hastaya bildirim) ve tablodaki ile log'daki yer tutucuları gerçek sebeplerle doldurdum.
- **Değişen dosyalar:** `docs/test/senaryolar.md`, `logs/tugba.md`
- **Neden:** PR incelemesindeki düzeltmeler ve B7/B9 test kartı.
- **Nasıl test edildi:** Canlı sistemde test numarasından bota yazarak ve panelden durumu kontrol ederek. `npm run lint` ve `npm run build` hatasız bitti.
- **Açık konular:** Bildirim gönderimi çalışmıyor (P3, P7, B7, B9): hastaya WhatsApp mesajı gitmiyor, Trello'daki kartta B7 ve B9 de eklendi. B4, B8, B13, B14 ve S2-S4 hâlâ denenmedi.
- **Başka ekipten istek:** Bot ekibi: bildirim gönderimi (`notifyAppointmentUpdate`) hatası.

## 2026-11-10 23:15 — Açık işler 48 ve 49, B7-B9 ve P4/P7 sonuçları
- **Kişi / araç:** Tuğba / Claude (web sohbeti)
- **Dal:** test-tugba
- **Ne yapıldı:** Açık işler 48 ve 49'u kapattım. 48: 6 Kasım kaydındaki sebep yer tutucusunun karşılığı, denenemeyen senaryoların sebepleri `senaryolar.md` sonuç tablosunda satır satır yazılıdır. 7 Kasım kaydındaki lint/build yer tutucusunun karşılığı: `npm run lint` ve `npm run build` 7 Kasım'da ve 10 Kasım'da çalıştırıldı, hatasız bitti. 49: 8 Kasım kaydındaki "bildirim gönderilemedi" uyarısı B7/B9'dan değil, hazırlık için yapılan panel onayından (P3) geliyordu. B7 ve B9 bottan yapılan işlemlerdir, panel bildirimi bu senaryolarda devreye girmez. B7 ve B9'u bu açıdan tekrar denedim. B7'de bot iptalden sonra sohbette "Randevunuz iptal edildi." yazdı. B9'da bot "Erteleme talebiniz alındı, klinik onayladığında bilgilendirileceksiniz." yazdı. Panelde B7'de randevu "İptal edildi" (iptal eden hasta), B9'da eski randevu "İptal edildi", yeni randevu "Onay bekliyor" görüldü. B8'i 9 Kasım'da denedim: randevuya 2 saatten az kalınca bot iptali reddetti ve kliniği aramasını söyledi. Panel senaryolarından P4 (red) ve P7 (iptal) 24 saat içinde denendi: işlemler çalışıyor, hastaya bildirim gönderilemedi (P3 ile aynı hata).
- **Değişen dosyalar:** `docs/test/senaryolar.md`, `logs/tugba.md`, `tasks.md`
- **Neden:** Açık işler listesi: 48 ve 49 (PR #33 incelemesi).
- **Nasıl test edildi:** Canlı sistemde test numarasından bota yazarak ve canlı panelde randevu işlemleri yaparak.
- **Açık konular:** Panelin bildirim hatası P3, P4 ve P7'de sürüyor (Trello'da kart açık, Kritik). B4, B13, B14, P5, P6, P8-P11 ve S2-S4 denenmedi, sebepleri tabloda yazılı.
- **Başka ekipten istek:** Bot ekibi: bildirim gönderimi (`notifyAppointmentUpdate`) hatası.
