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

## 2026-10-31 23:55 — Gemini test veri seti (dataset.json)
- **Kişi / araç:** Ebru / Claude (web sohbeti)
- **Dal:** feature/gemini-dataset
- **Ne yapıldı:** `scripts/gemini-test/dataset.json` oluşturuldu. 68 gerçekçi hasta mesajı ve her biri için beklenen sonuç var: intent, procedure, date, time_of_day, time. Mesajlar yazım hatalı, kısaltmalı, emojili, dolaylı ("dişim zonkluyor") ve alakasız ("fiyatınız ne kadar?") örnekler içeriyor. Gerçek isim ve telefon numarası yok.
- **Değişen dosyalar:** `scripts/gemini-test/dataset.json`, `logs/ebru.md`
- **Neden:** Gemini test seti görev kartı. Alan adları Sevde ile birlikte sabitlendi (expected.intent, expected.procedure, expected.date, expected.time_of_day, expected.time).
- **Nasıl test edildi:** Dosya Node ile okunup geçerli JSON olduğu ve 68 kayıt içerdiği doğrulandı. `npm run lint` ve `npm run build` hatasız tamamlandı. Gemini ile çalıştırılmadı.
- **Açık konular:** Test kodu henüz yazılmadı (Sevde yazacak). "Bu hafta", "haftaya" gibi tek bir günü göstermeyen ifadelerde date null bırakıldı.
- **Başka ekipten istek:** Sevde: dosyanın başındaki `today` değeri (2026-11-02) Gemini'ye "bugün" olarak verilecek. Kayıtlar `cases` listesinde.

## 2026-11-02 00:17 — İptal ve erteleme mesajı
- **Kişi / araç:** Ebru / Codex
- **Dal:** fix bot mesaj parametre isimleri
- **Ne yapıldı:** İptal süresi mesajı, iptal ve erteleme işlemlerini kapsayacak şekilde güncellendi. Bot ekibinin tasks.md içindeki 9. maddesi kapatıldı.
- **Değişen dosyalar:** `lib/bot/messages.ts`, `tasks.md`
- **Neden:** İptal süresi kuralı erteleme için de geçerli.
- **Nasıl test edildi:** `npm run lint` ve `npm run build` başarılı.
- **Açık konular:** Yok.
- **Başka ekipten istek:** Yok.

## 2026-11-08 21:10 — Akış için eksik metinler eklendi
- **Kişi / araç:** Ebrar / Claude
- **Dal:** fix/bot-akis-eksik-metinler
- **Ne yapıldı:**  Akış için eksik metinler eklendi
- **Değişen dosyalar:** `lib/bot/messages.ts`, `tasks.md`, `logs/ebru.md`
- **Neden:** Geçersiz ad soyad yazıldığında ayrı bir uyarı metni yoktu. İşlem veya doktor listesi 10'u geçerse kullanılacak "Diğer" satırı için metin yoktu.
- **Nasıl test edildi:** `npm run lint` hatasız
## 2026-11-08 20:50 — `messages.ts` biçim bozukluğu giderildi
- **Kişi / araç:** Ebru / Codex
- **Dal:** fix/bot-mesaj-bicim-duzeltme
- **Ne yapıldı:** `messages.ts` biçim bozukluğu giderildi.
- **Değişen dosyalar:** `lib/bot/messages.ts`, `tasks.md`, `logs/ebru.md`
- **Neden:** Biçim bozuluğu.
- **Nasıl test edildi:** `npm run build` başarılı.
- **Açık konular:** Yok
- **Başka ekipten istek:** Yok

## 2026-11-10 00:15 — Gemini test veri seti güncellendi
- **Kişi / araç:** Ebru / Codex
- **Dal:** fix/bot-gemini-dataset
- **Ne yapıldı:** Silinen 48–68 arası vakalar geri eklendi; dört yeni vaka 69–72 olarak sona eklendi. id 13 için işlem `Muayene`, id 24 için saat `null` yapıldı. “Menü” yerine Gemini’ye gönderilebilen “ana sayfaya dönmek istiyorum” örneği eklendi. Üç ay sonrası randevu örneğinin intent’i `book`, tarihi `null` yapıldı. Ayrıca 10. maddenin tamamlandığı ve PR #40 ile 26. maddenin kapatıldığı kaydedildi.
- **Değişen dosyalar:** `scripts/gemini-test/dataset.json`, `tasks.md`, `logs/ebru.md`
- **Neden:** PR #39 ve `tasks.md` 45. madde.
- **Nasıl test edildi:** JSON’un geçerli olduğu, 72 kayıt içerdiği, id’lerin 1–72 arasında kesintisiz olduğu ve dosya sonunda satır sonu bulunduğu kontrol edildi. Gemini ile çalıştırılmadı.
- **Açık konular:** Gemini test scriptiyle çalıştırma ve rapor oluşturma ayrıca tamamlanacak. 32. madde için Sevde’nin `flow.ts` entegrasyonu bekleniyor.
- **Başka ekipten istek:** Yok.

## 2026-11-11 12:25 — Bot mesaj adımları Step tipine bağlandı
- **Kişi / araç:** Ebru / Claude (web sohbeti)
- **Dal:** feat/bot-steps-tip-baglama
- **Ne yapıldı:** `lib/bot/messages.ts` içindeki `steps` nesnesi `Step` tipine bağlandı (`satisfies Partial<Record<Step, string>>`). Adım isimlerinin `steps.ts` ile ayrışması artık derleme hatası veriyor. `tasks.md` #8 kapatıldı ve maddesi silindi.
- **Değişen dosyalar:** `lib/bot/messages.ts`, `tasks.md`, `logs/ebru.md`
- **Neden:** `tasks.md` #8 (adım isimlerini `steps.ts` ile eşleştirme) kapatıldı.
- **Nasıl test edildi:** `npm run lint` hatasız. `npm run build` bu makinede tamamlanamadı: `/(site)/page` üretilirken `createPublicClient` (`components/site/Treatments.tsx`) hata verdi; yerelde `NEXT_PUBLIC_SUPABASE_*` ortam değişkenleri eksik. Hata `messages.ts` ile ilgili değil. `npx tsc --noEmit` hatasız tamamlandı. WhatsApp üzerinden deneme yapılmadı.
- **Açık konular:** Build yerelde ortam değişkenleri eksik olduğu için doğrulanamadı. #39, #43, #44 maddelerinin Ebru kısmı (telefonsuz metinler, tarih uyarı metni) sonraki PR'da yapılacak; Sevde kısmı `flow.ts`'te sürüyor.
- **Başka ekipten istek:** Ahmet Yasin: yerelde build alabilmem için `.env.local` değerleri gerekiyor.
