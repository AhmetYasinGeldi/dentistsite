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

## 2026-10-31 20:30 — Mesaj kaydı, tekrar engelleme ve oturum durumu
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-oturum
- **Ne yapıldı:** Adım isimleri `lib/bot/steps.ts` içinde tek listede tanımlandı (Ebru'nun `messages.ts` anahtarlarıyla aynı). `lib/bot/session.ts` eklendi: `touchSession` (numara yoksa `idle` ile oluşturur, `last_inbound_at`'i günceller), `getSession` (bilinmeyen adımı ve bozuk taslağı güvenli varsayılana çevirir), `setSession`, `resetSession`; taslak seçimler (`context`) zod şemasıyla tanımlı. Buton ve liste cevapları okunuyor (`getReplyId`, `getMessageText`) ve `wa_messages.body`'ye seçilen başlık yazılıyor. Tekrar engelleme (23505) önceki PR'dan beri çalışıyor. `tasks.md` 5. madde kapatıldı: bir gruptaki mesajlar tek tek doğrulanıyor, geçersiz olan loglanıp atlanıyor, diğerleri işleniyor. 6. madde (log'daki dal adı) bu kayıttan itibaren doğru dal adlarıyla kapatıldı.
- **Değişen dosyalar:** `lib/bot/steps.ts`, `lib/bot/session.ts`, `lib/whatsapp/payload.ts`, `app/api/whatsapp/webhook/route.ts`, `tasks.md`, `logs/sevde.md`
- **Neden:** Trello kartı "[Sevde] Mesaj kaydı, tekrar engelleme ve oturum durumu".
- **Nasıl test edildi:** `eslint` ve `tsc --noEmit` hatasız. Sahte bir Supabase (PostgREST taklidi) ile yerelde: aynı webhook iki kez gönderildi, ikincisi atlandı ve bot bir kez cevap vermeye çalıştı; butona basma mesajı `body = "Randevu al"` olarak kaydedildi; `wa_sessions` satırı `step = idle` ve dolu `last_inbound_at` ile oluştu. Biri geçersiz numaralı iki mesajlık grupta geçerli mesaj işlendi, geçersiz olan loglanıp atlandı.
- **Açık konular:** `getSession`/`setSession` gerçek veritabanında denenmedi; sohbet akışı yazılırken kullanılacak. Gerçek telefon testi Meta webhook kaydını bekliyor.
- **Başka ekipten istek:** Yok.

## 2026-10-31 20:20 — Panel bildirimi: notifyAppointmentUpdate
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-bildirim
- **Ne yapıldı:** `notifyAppointmentUpdate` dolduruldu (imza aynı). Randevu ve hastanın telefonu okunuyor; onaylandı, reddedildi ve klinik iptal etti durumlarında Ebru'nun `messages.ts`'teki bildirim metni tarih `formatDateTime` ile yazılarak gönderiliyor. Hastanın son mesajı 24 saatten eskiyse Meta'ya istek atılmadan `WINDOW_CLOSED` dönüyor. Diğer sonuçlar: `NOT_FOUND`, `NO_NOTIFICATION` (ör. hasta kendisi iptal etti), `SEND_FAILED`, `DB_ERROR`.
- **Değişen dosyalar:** `lib/whatsapp/notify.ts`, `logs/sevde.md`
- **Neden:** AGENTS.md 7. bölüm ortak bildirim fonksiyonu; panelde onay/red/iptal sonrası hastaya bildirim (31 Ekim uçtan uca akış).
- **Nasıl test edildi:** `eslint` ve `tsc --noEmit` hatasız. Sahte Supabase ile geçici bir test adresinden: 2 saat önce yazmış hastanın onaylanan randevusunda gönderime geçildi (test ortamında WhatsApp anahtarı olmadığı için `SEND_FAILED`); 30 saat önce yazmışta `WINDOW_CLOSED`; hastanın kendi iptalinde `NO_NOTIFICATION`; olmayan randevuda `NOT_FOUND`. Geçici test adresi silindi.
- **Açık konular:** Gerçek gönderim Meta webhook kaydını bekliyor. Red sebebi (`rejection_reason`) mesaja eklenmiyor; Ebru'nun metninde yer yok.
- **Başka ekipten istek:** Panel ekibi (Esma, Merve): onay/red/iptal sonrası `notifyAppointmentUpdate(id)` çağrılmalı, `sent: false` ise "Hastaya WhatsApp bildirimi gönderilemedi" uyarısı gösterilmeli.

## 2026-11-04 21:30 — İnceleme düzeltmeleri (tasks.md 16, 17, 18, 29) ve gerçek telefon testi
- **Kişi / araç:** Sevde / Claude
- **Dal:** fix/bot-inceleme-duzeltmeleri
- **Ne yapıldı:** `tasks.md` 16, 17, 18 ve 29. maddeler kapatıldı. 16: boş oturum için paylaşılan sabit yerine her çağrıda yeni nesne döndüren `emptySession()`. 17: `setSession` `update` yerine `upsert` yapıyor; satır yoksa oluşturuyor. 18: `slotStart` saat dilimi içeren ISO tarih-saat olarak doğrulanıyor (`z.iso.datetime({ offset: true })`). 29: red bildirimine panelde girilen `rejection_reason` ekleniyor ("Sebep: ..."); sebep boşsa eski metin aynen gidiyor. Bunun için `messages.ts`'teki `notifications.rejected` isteğe bağlı sebep alan bir fonksiyona çevrildi (Ebru'ya haber verildi).
- **Değişen dosyalar:** `lib/bot/session.ts`, `lib/whatsapp/notify.ts`, `lib/bot/messages.ts`, `tasks.md`, `logs/sevde.md`
- **Neden:** PR #11 ve #22 inceleme notları (`tasks.md`).
- **Nasıl test edildi:** `eslint` ve `tsc --noEmit` hatasız. `slotStart`: `2026-11-05T10:30:00+03:00`, `...Z` ve `...+00:00` geçti; `2026-11-05 10:30`, `2026-11-05`, serbest metin ve boş metin reddedildi. Sahte Supabase ile: bir hastanın boş oturumuna yazılan tarih ikinci hastanın oturumuna sızmadı; satırı olmayan numarada `setSession` satırı oluşturdu. Red metni sebepli, boşluklu, boş ve `null` sebeple denendi; sondaki nokta çiftlenmiyor. **Gerçek telefon testi:** 3 Kasım 13:10'da kayıtlı test numarasından canlı bota "merhaba" yazıldı, yankı cevabı geldi; webhook, imza kontrolü ve metin gönderimi canlıda çalışıyor (önceki kayıtlardaki "gerçek telefon testi bekliyor" maddesi kapandı).
- **Açık konular:** Buton ve liste mesajları gerçek telefonda randevu akışı birleşince denenecek.
- **Başka ekipten istek:** Yok.

## 2026-11-04 21:40 — Randevu alma akışı
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-randevu-akisi
- **Ne yapıldı:** Yankı botu kaldırıldı, webhook artık sohbet akışını çağırıyor (`lib/bot/flow.ts`). Akış: karşılama → menü (Randevu al / Randevumu gör / İptal / Ertele) → aktif randevu kontrolü (varsa Gör / İptal et / Ertele) → yeni hastaysa ad soyad → işlem listesi → doktor listesi (tek doktorsa atlanır) → açık günler (sayfalı, "Diğer günler") → saat çoksa Sabah / Öğleden sonra → saat listesi (`get_available_slots`, sayfalı, "Diğer saatler") → özet + Onayla / Değiştir / Vazgeç → `pending` randevu → "Talebiniz alındı". "menü" her adımdan menüye döner; anlaşılmayan cevapta uyarı ve aynı soru tekrar gelir. 23P01'de "saat az önce doldu" ve saat listesi, RD001'de aktif randevu seçenekleri gösteriliyor. "Randevumu gör" çalışıyor; İptal / Ertele şimdilik randevu bilgisini gösteriyor (ayrı kart). Veritabanı sorguları `lib/bot/queries.ts`, tarih hesapları `lib/bot/schedule.ts` içinde. Metinler `messages.ts`'ten.
- **Değişen dosyalar:** `lib/bot/flow.ts`, `lib/bot/queries.ts`, `lib/bot/schedule.ts`, `app/api/whatsapp/webhook/route.ts`, `lib/bot/echo.ts` (silindi), `tasks.md`, `logs/sevde.md`
- **Neden:** Trello kartı "[Sevde] Randevu alma akışı".
- **Nasıl test edildi:** `eslint` ve `tsc --noEmit` hatasız. `schedule.ts` için Node birim testleri (haftanın günü, ay/yıl geçişi, açık günler, sabah/öğleden sonra ayrımı, ad soyad doğrulaması). Seed verisiyle kurulmuş sahte Supabase ve gönderilen mesajları yakalayan sahte Meta ile uçtan uca konuşma: yeni hasta Muayene / Dt. Elif Kaya / 13 Kasım Cuma / öğleden sonra / 15:30 seçip onayladı, veritabanında `pending`, `source = whatsapp`, 30 dakikalık randevu oluştu. Aynı hasta tekrar "Randevu al" deyince aktif randevu seçenekleri geldi, "Gör" doğru bilgiyi gösterdi. Tek doktorlu işlemde (Kanal Tedavisi) doktor adımı atlandı. Başka hastanın aldığı saati eski listeden seçen hastaya "saat az önce doldu" ve güncel liste geldi. Geçersiz ad ve listedeyken yazılan metin doğru karşılandı. Aynı webhook iki kez gönderildiğinde bot bir kez cevap verdi. Bütün liste ve buton mesajları Meta sınırlarına uydu, sunucu log'unda hata yok.
- **Açık konular:** Gerçek test telefonunda baştan sona deneme (kartın "bitti" şartı) PR birleşip canlıya çıkınca yapılacak. İptal / erteleme ayrı kartta. `tasks.md` 32: eksik iki metin (Ebru).
- **Başka ekipten istek:** Ahmet Yasin: `clinic_settings.phone` canlıda boşsa doldurulmalı (iptal/erteleme ve fiyat sorularında hastaya gösterilecek).

## 2026-11-07 15:40 — Randevumu gör, iptal ve erteleme akışları
- **Kişi / araç:** Sevde / Claude
- **Dal:** feat/bot-iptal-erteleme
- **Ne yapıldı:** Menüdeki "İptal / Ertele" ve aktif randevu uyarısındaki "İptal et / Ertele" butonları bağlandı. İptal / Ertele: randevu bilgisi + İptal et / Ertele / Vazgeç. İptal: onay sorusu (Evet, iptal et / Vazgeç) → randevu `cancelled`, `cancelled_by = patient` → "Randevunuz iptal edildi". Erteleme: randevunun doktoru ve işlemiyle açık günler → (gerekirse) sabah / öğleden sonra → saat → "… tarihine taşınacak. Onaylıyor musunuz?" → `reschedule_appointment` (`p_cancelled_by = patient`) → "Erteleme talebiniz alındı". Randevuya `cancel_limit_hours` saatten az kaldıysa iptal ve erteleme yapılmıyor, kliniğin telefonuyla "lütfen kliniği arayın" deniyor (iş kuralı 3). Onaydan hemen önce randevunun hâlâ bu hastanın aktif randevusu olduğu ve süre sınırı tekrar kontrol ediliyor. Yeni saat bu arada dolduysa (23P01 / RD004) "saat az önce doldu" ve güncel saat listesi geliyor, eski randevu bozulmuyor. Tarih/saat seçimi randevu alma ile ortak; ertelemede soru metinleri `steps.reschedule_*`. `steps.ts`'e `reschedule_time_period` eklendi.
- **Değişen dosyalar:** `lib/bot/flow.ts`, `lib/bot/queries.ts`, `lib/bot/schedule.ts`, `lib/bot/steps.ts`, `logs/sevde.md`
- **Neden:** Trello kartı "[Sevde] Randevumu gör, iptal ve erteleme akışları"; test senaryoları B7 ve B9.
- **Nasıl test edildi:** `eslint` ve `tsc --noEmit` hatasız. `canPatientChange` için birim testi (tam sınır, 1 dakika eksik, şimdi). Sahte Supabase ve sahte Meta ile konuşma: menüden erteleme yapıldı, eski randevu `cancelled / patient`, yenisi `pending` ve `rescheduled_from` eskisini gösteriyor; "Zaten aktif randevunuz var" → İptal et → Evet ile randevu `cancelled / patient` oldu; aktif randevusu olmayan hastaya "Aktif randevunuz bulunmuyor" geldi; 1 saat sonraki randevuda iptal ve erteleme engellendi, mesajda klinik telefonu göründü; erteleme sırasında anlaşılmayan cevap ve Vazgeç doğru karşılandı. Sunucu log'unda hata yok.
- **Açık konular:** Gerçek telefonda deneme PR birleşince yapılacak. `clinic_settings.phone` boşsa mesaj "Lütfen kliniği arayın." diye biter.
- **Başka ekipten istek:** Test ekibi: B7 ve B9 tekrar denenebilir.
