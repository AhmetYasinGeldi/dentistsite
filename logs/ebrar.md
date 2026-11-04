## 2026-10-31 22:27 — Hero bölümü ve WhatsApp butonu
- **Kişi / araç:** Ebrar / Gemini
- **Dal:** ebrar-site-taslak
- **Ne yapıldı:** Sitenin ana karşılama alanı (HeroSection) oluşturuldu ve URL kodlamalı WhatsApp yönlendirme butonu eklendi.
- **Değişen dosyalar:** `app/(site)/page.tsx`, `components/site/HeroSection.tsx`
- **Neden:** Projenin canlıya alınabilmesi ve bot ekibinin webhook bağlantısını yapabilmesi için gereken kilit aşama.
- **Nasıl test edildi:** `npm run dev` ile yerel sunucuda çalıştırıldı, çevresel değişken okutuldu ve butonun doğru adrese yönlendirdiği doğrulandı.
- **Açık konular:** Doktorlar ve Tedaviler bölümlerinin görev dağılımı yapılacak, Ahmet Çiçek page.tsx içinde birleştirmeleri sağlayacak.
- **Başka ekipten istek:** Yok.

## 2026-11-03 13:28 — Hero düzeltmeleri (tasks.md 19-22)
- **Kişi / araç:** Ebrar / Claude
- **Dal:** feat/site-hero-fixes
- **Ne yapıldı:** tasks.md Site ekibi 19-22 numaralı maddeler kapatıldı. 19: Hero metni gerçek akışa uygun, vaat içermeyen bir metinle değiştirildi. 20: WhatsApp numarası tanımlı değilse sunucu log'una uyarı yazılıyor ve buton gösterilmiyor. 21: `HeroSection.tsx` ve `app/(site)/page.tsx` içindeki artık yorumlar silindi, girinti 2 boşluğa çekildi, dosya sonlarına satır sonu eklendi. 22: Dal `feat/site-...` kuralına göre açıldı, `tasks.md`'de yalnızca Site ekibi bölümü değiştirildi.
- **Değişen dosyalar:** `components/site/HeroSection.tsx`, `app/(site)/page.tsx`, `tasks.md`, `logs/ebrar.md`
- **Neden:** PR #12 incelemesinde açılan düzeltmeleri kapatmak.
- **Nasıl test edildi:** `npm run lint` hatasız, `npm run build` başarılı. localhost:3000'de buton linkinin numara ve encode edilmiş hazır mesajla oluştuğu kontrol edildi. `.env.local` dosyasında numara geçici olarak kaldırılınca butonun gizlendiği, numara geri eklenince geri geldiği doğrulandı.
- **Açık konular:** Üst menü (Header) ve mobilde sabit WhatsApp butonu henüz yapılmadı, sonraki işte yapılacak.
- **Başka ekipten istek:** Yok.
