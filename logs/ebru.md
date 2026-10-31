## 2026-10-29 — Bot mesaj metinleri
- **Kişi / araç:** Ebru / Codex
- **Dal:** main (yerel dosya; feat/bot-messages dalı oluşturma girişimi dosya sistemi izni nedeniyle başarısız, commit/push yapılmadı)
- **Ne yapıldı:** Botun Türkçe mesajları, buton ve liste etiketleri lib/bot/messages.ts içinde hazırlandı. Tarihli özetler ortak İstanbul saat dilimi yardımcısını, durum ve hata metinleri mevcut ortak eşlemeleri kullanıyor.
- **Değişen dosyalar:** lib/bot/messages.ts, logs/ebru.md
- **Neden:** Bot mesaj metinleri görev kartı.
- **Nasıl test edildi:** 47 mesaj anahtarı TypeScript dönüşümüyle yüklendi; buton gruplarının en fazla üç seçenek içerdiği, etiketlerin 20 karakteri aşmadığı ve dinamik özetlerin tarih/saat ürettiği kontrol edildi. npm PATH üzerinde ve node_modules kurulu olmadığı için proje lint/build çalıştırılmadı.
- **Açık konular:** Sevde'nin akışına entegrasyon ve WhatsApp üzerinden deneme yapılmadı; mesaj isimleri akışa göre revize edilebilir. PR öncesi dal açılmalı, lint/build çalıştırılmalı.
- **Başka ekipten istek:** Yok.

## 2026-10-29 — Mesaj dosyası sadeleştirildi
- **Kişi / araç:** Kullanıcı / Codex (isim önceki kayıtta varsayılmıştır)
- **Dal:** main; commit/push yapılmadı.
- **Ne yapıldı:** Kullanıcının giriş seviyesi çözüm isteğiyle import, özel tip ve fonksiyonlar kaldırıldı. Mesajlar düz metinlerden oluşan bir nesneye dönüştürüldü; değişken bilgiler için yer tutucular eklendi.
- **Değişen dosyalar:** lib/bot/messages.ts, logs/ebru.md
- **Neden:** Kurs seviyesine uygun, kolay okunabilen mesaj dosyası hazırlamak.
- **Nasıl test edildi:** 47 metin ve buton/liste etiketi uzunlukları Node ile kontrol edildi. Proje lint/build çalıştırılmadı.
- **Açık konular:** Sevde'nin akışında yer tutucular gerçek bilgilerle değiştirilmeli. Önceki kayıttaki dinamik fonksiyon kontrolü eski sürüme aittir. Bot entegrasyonu yapılmadı.
- **Başka ekipten istek:** Yok.

## 2026-10-31 01:00 — Bot mesaj metinleri, Sevde'nin adım listesine göre
- **Kişi / araç:** Ebru / Claude (web sohbeti)
- **Dal:** feature/bot-mesaj-metinleri
- **Ne yapıldı:** `lib/bot/messages.ts` Sevde'nin verdiği adım isimleriyle (menu, ask_name, choose_procedure, ...) yeniden yazıldı. Önceki sürümdeki camelCase isimler (welcome, askFullName vb.) kaldırıldı. Buton, liste satırı, onay özetleri, panel bildirimleri ve hata mesajları eklendi.
- **Değişen dosyalar:** `lib/bot/messages.ts`, `logs/ebru.md`
- **Neden:** Bot mesaj metinleri görev kartı. Dosya Sevde'nin `steps.ts` adlarıyla uyumlu olsun diye.
- **Nasıl test edildi:** `npm run lint` ve `npm run build` hatasız tamamlandı. Buton (≤20) ve liste satırı (≤24) uzunlukları elle kontrol edildi. WhatsApp üzerinden deneme yapılmadı.
- **Açık konular:** Sevde'nin `lib/bot/steps.ts` dosyasıyla isimler henüz karşılaştırılmadı. Klinik telefonu parametre olarak bırakıldı. Eski sürümdeki "Randevuyu koru" butonu ve geçersiz ad mesajı eklenmedi.
- **Başka ekipten istek:** Sevde: tarih ve saat fonksiyonlara hazır metin olarak ("5 Kasım 2026 Perşembe, 10:30") verilecek.