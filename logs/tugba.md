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