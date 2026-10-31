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

## 2026-10-31 20:10 — WhatsApp gönderim yardımcıları: metin, buton, liste
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-gonderim
- **Ne yapıldı:** `sendText`, `sendButtons` ve `sendList` yazıldı; Meta sınırları (en fazla 3 buton ve 20 karakter, toplam 10 satır, satır 24, açıklama 72, liste butonu 20) gönderimden önce zod ile kontrol ediliyor, sınırı aşan mesaj gönderilmiyor (`INVALID_MESSAGE`). 10'dan fazla seçenek için `paginateRows` ("Diğer ..." satırı, id `more:<sayfa>`) ve `parseMoreRowId` eklendi. Gönderilen her mesaj `wa_messages`'a `direction = 'out'` ve gövdesiyle (`payload`) yazılıyor; 24 saat penceresi hatası `WINDOW_CLOSED` olarak dönüyor, uygulama çökmüyor. Yankı botu yeni `sendText` adını kullanıyor.
- **Değişen dosyalar:** `lib/whatsapp/send.ts`, `lib/whatsapp/interactive.ts`, `lib/bot/echo.ts`, `logs/sevde.md`
- **Neden:** Trello kartı "[Sevde] WhatsApp gönderim yardımcıları: metin, buton, liste".
- **Nasıl test edildi:** `eslint` ve `tsc --noEmit` hatasız. Node ile birim testi: 3 butonlu mesaj geçerli; 4 buton, 21 karakterlik başlık, aynı başlıklı iki buton, 11 satır, başlıksız ikinci bölüm, 25 karakterlik satır ve 73 karakterlik açıklama reddediliyor. 25 saat 9+Diğer / 9+Diğer / 7 olarak sayfalanıyor ve her sayfa liste sınırına uyuyor. Graph API buton gövdesi beklenen biçimde.
- **Açık konular:** Üç mesaj türünün test telefonuna ulaşması (kartın "bitti" şartı) Meta webhook kaydını bekliyor.
- **Başka ekipten istek:** Yok.
