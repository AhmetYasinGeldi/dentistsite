# Log — Sevde

## 2026-10-28 23:55 — WhatsApp webhook: doğrulama, imza kontrolü ve yankı botu
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-webhook
- **Ne yapıldı:** Webhook'un GET doğrulaması ve POST imza kontrolü (X-Hub-Signature-256, HMAC-SHA256) yazıldı. Gelen mesaj wa_messages'a kaydediliyor (tekrar gelen mesaj 23505 ile atlanıyor), wa_sessions.last_inbound_at güncelleniyor ve bot gelen metni geri gönderiyor. statuses olayları işlenmiyor, imza geçtikten sonra hata olsa bile 200 dönülüyor.
- **Değişen dosyalar:** `app/api/whatsapp/webhook/route.ts`, `lib/whatsapp/verify.ts`, `lib/whatsapp/payload.ts`, `lib/whatsapp/send.ts`, `lib/bot/echo.ts`
- **Neden:** Trello kartı "[Sevde] Webhook: doğrulama, imza kontrolü ve yankı botu".
- **Nasıl test edildi:** `npm run lint` ve `tsc` hatasız. Sahte anahtarlarla yerelde: doğru token ile GET 200 + challenge, yanlış token 403; imzasız ve yanlış imzalı POST 401; doğru imzalı statuses ve mesaj POST'u 200. Gerçek numaradan uçtan uca deneme: (doldurulacak)
- **Açık konular:** Meta'nın webhook'a ulaşabilmesi için herkese açık bir adres (Vercel önizleme veya tünel) gerekiyor. Yankı botu geçici; sohbet akışı gelince `lib/bot/echo.ts` yerine akışın girişi çağrılacak.
- **Başka ekipten istek:** Ahmet Yasin: Meta panelinde webhook adresinin ve verify token'ın girilmesi, `messages` alanına abone olunması.
