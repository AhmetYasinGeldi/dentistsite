# Log — Sevde

## 2026-10-28 23:55 — WhatsApp webhook: doğrulama, imza kontrolü ve yankı botu
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-webhook
- **Ne yapıldı:** Webhook'un GET doğrulaması ve POST imza kontrolü (X-Hub-Signature-256, HMAC-SHA256) yazıldı. Gelen mesaj wa_messages'a kaydediliyor (tekrar gelen mesaj 23505 ile atlanıyor), wa_sessions.last_inbound_at güncelleniyor ve bot gelen metni geri gönderiyor. statuses olayları işlenmiyor, imza geçtikten sonra hata olsa bile 200 dönülüyor.
- **Değişen dosyalar:** `app/api/whatsapp/webhook/route.ts`, `lib/whatsapp/verify.ts`, `lib/whatsapp/payload.ts`, `lib/whatsapp/send.ts`, `lib/bot/echo.ts`
- **Neden:** Trello kartı "[Sevde] Webhook: doğrulama, imza kontrolü ve yankı botu".
- **Nasıl test edildi:** `npm run lint` ve `tsc` hatasız. Sahte anahtarlarla yerelde: doğru token ile GET 200 + challenge, yanlış token 403; imzasız ve yanlış imzalı POST 401; doğru imzalı statuses ve mesaj POST'u 200. `npm run build` Ahmet Yasin'in PR incelemesinde başarılı. Gerçek numaradan uçtan uca deneme henüz yapılmadı; Meta panelinde webhook adresi site canlıya alınınca girilecek.
- **Açık konular:** Meta'nın webhook'a ulaşabilmesi için herkese açık bir adres (Vercel önizleme veya tünel) gerekiyor. Yankı botu geçici; sohbet akışı gelince `lib/bot/echo.ts` yerine akışın girişi çağrılacak.
- **Başka ekipten istek:** Ahmet Yasin: Meta panelinde webhook adresinin ve verify token'ın girilmesi, `messages` alanına abone olunması.

## 2026-10-30 23:55 — Webhook PR inceleme düzeltmeleri
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-webhook
- **Ne yapıldı:** Sadece `field === "messages"` olan webhook değişiklikleri işleniyor, diğer alanlar sessizce atlanıyor. `from` alanı `wa_sessions.phone` kısıtıyla aynı biçimde (10-15 rakam) doğrulanıyor. Mesaj gönderirken WhatsApp ortam değişkenleri eksikse adları log'a yazılıp gönderim yapılmıyor. Yankı botu mesajı aynen geri gönderiyor; girinti düzeltildi.
- **Değişen dosyalar:** `lib/whatsapp/payload.ts`, `lib/whatsapp/send.ts`, `lib/bot/echo.ts`, `logs/sevde.md`
- **Neden:** Ahmet Yasin'in PR #3 inceleme yorumları.
- **Nasıl test edildi:** `eslint` ve `tsc --noEmit` hatasız. Sahte anahtarlarla yerelde: şablon durum güncellemesi 200 döndü ve log'a hata düşmedi; geçersiz `from` içeren mesaj 200 döndü, log'a yazıldı ve işlenmedi.
- **Açık konular:** Gerçek telefon testi Meta webhook kaydını bekliyor. Gemini eklenince cevabı hemen dönüp işi `after()` ile arka planda yapma konuşulacak.
- **Başka ekipten istek:** Yok.
