# Tuğba - Test Günlüğü

## 2026-10-30 23:10 — Bot, panel ve site test senaryoları
- **Kişi / araç:** Tuğba / Claude (web sohbeti), VS Code
- **Dal:** test-tugba
- **Ne yapıldı:** Projeyi yerel ortama kurdum. `AGENTS.md` ve `README.md`'yi okuyup bot (14), panel (11) ve site (4) için test senaryolarını yazdım. Her senaryoda adımlar ve beklenen sonuç var; beklenen sonuçları `AGENTS.md`'deki kurallara göre hazırladım. P1 ve P2 senaryoları
- **Değişen dosyalar:** `docs/test/senaryolar.md`, `logs/tugba.md`
- **Neden:** Trello Test panosundaki "Test senaryoları" kartı. Sistem parçaları hazır oldukça aynı senaryolarla tutarlı test yapabilmek.
- **Nasıl test edildi:** Doküman olduğu için çalıştırılacak kod yok. Senaryoları `AGENTS.md` ve `supabase/01_schema.sql` ile karşılaştırdım (örneğin iptal sınırı `cancel_limit_hours` varsayılanı 2 saat, slot süresi en fazla 30 dakika). Yerel ortamda P1 (giriş/çıkış) ve P2 (girişsiz /admin) denendi: giriş çalışıyor, çıkıştan sonra geri tuşu panel verisini göstermiyor, siteye yönlendiriyor. Diğer senaryolar sistem hazır oldukça denenecek.
- **Açık konular:** Doktor pasifleştirilince mevcut randevulara ne olacağı `AGENTS.md`'de yazmıyor (P9); Panel ekibiyle netleştirilmeli. Senaryolar henüz uygulanmadı, sistem hazır oldukça denenecek.
- **Başka ekipten istek:** Yok.
