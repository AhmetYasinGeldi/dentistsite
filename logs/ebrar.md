## 2026-10-31 22:27 — Hero bölümü ve WhatsApp butonu
- **Kişi / araç:** Ebrar / Gemini
- **Dal:** ebrar-site-taslak
- **Ne yapıldı:** Sitenin ana karşılama alanı (HeroSection) oluşturuldu ve URL kodlamalı WhatsApp yönlendirme butonu eklendi.
- **Değişen dosyalar:** `app/(site)/page.tsx`, `components/site/HeroSection.tsx`
- **Neden:** Projenin canlıya alınabilmesi ve bot ekibinin webhook bağlantısını yapabilmesi için gereken kilit aşama.
- **Nasıl test edildi:** `npm run dev` ile yerel sunucuda çalıştırıldı, çevresel değişken okutuldu ve butonun doğru adrese yönlendirdiği doğrulandı.
- **Açık konular:** Doktorlar ve Tedaviler bölümlerinin görev dağılımı yapılacak, Ahmet Çiçek page.tsx içinde birleştirmeleri sağlayacak.
- **Başka ekipten istek:** Yok.