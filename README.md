# Diş Kliniği WhatsApp Randevu Sistemi

Tek bir diş kliniği için WhatsApp üzerinden randevu alınan bir sistem. Hasta kliniğin sitesindeki butona basar, WhatsApp botuyla yazışarak randevu talep eder; sekreter admin panelinden talebi onaylar veya reddeder, hasta sonucu WhatsApp'tan öğrenir.

Kodun neredeyse tamamı yapay zeka ajanlarıyla yazılır. Bu yüzden bu dosyadaki kurallar, kodun kendisi kadar önemli.

## Ekip ve sorumluluk alanları

| Ekip | Kişiler | Çalıştığı yer |
|---|---|---|
| Lider, veritabanı, entegrasyon | Ahmet Yasin | ayar dosyaları, `supabase/`, `lib/supabase/`, `lib/shared/` |
| Bot (WhatsApp + sohbet + Gemini) | Sevde, Ebru | `app/api/whatsapp/`, `lib/whatsapp/`, `lib/bot/`, `lib/ai/`, `scripts/gemini-test/` |
| Admin paneli | Esma, Merve | `app/admin/`, `components/admin/` |
| Tanıtım sitesi | Ahmet Çiçek, Ömer, Ebrar | `app/(site)/`, `components/site/` |
| Test ve kalite | Tuğba, Nezahat | `docs/test/` |
| Sunum | Belinay | `docs/sunum/` |

Ayrıntılı klasör yapısı `AGENTS.md` dosyasındadır.

## Kurulum

1. Repoyu klonlayın ve `npm install` çalıştırın.
2. `.env.example` dosyasını `.env.local` adıyla kopyalayın. Değerleri Ahmet Yasin size özel olarak iletecek.
3. `npm run dev` ile çalıştırın. Site `http://localhost:3000`, panel `http://localhost:3000/admin` adresindedir.

## Altın kurallar

1. **`main` dalına asla doğrudan push yok.** Her iş kendi dalında yapılır, Pull Request açılır, Ahmet Yasin onaylar.
2. **Sadece kendi alanınızdaki dosyaları değiştirin.** Başka ekibin dosyasında değişiklik gerekiyorsa o ekibe veya Ahmet Yasin'e haber verin.
3. **Veritabanı şemasına dokunmayın.** Tablo, sütun veya kural eksikse Ahmet Yasin'e söyleyin.
4. **Şifreler ve anahtarlar gizlidir.** `.env.local` dosyası commit'lenmez; anahtarlar koda, ekran görüntüsüne, gruba, log dosyasına ve yapay zekaya yapıştırılmaz.
5. **Gerçek kişisel veri yok.** Testlerde sahte isimler kullanın. Bu bir sağlık verisi sistemi; gerçek hasta bilgisi kesinlikle girilmez.
6. **Her işin sonunda log tutun.** `logs/<adınız>.md` dosyanıza ne yaptığınızı yazın (aşağıda nasıl).
7. **Yeni paket eklemeden önce sorun.**

## Yapay zeka ajanlarıyla çalışırken

**Ajanınız kuralları nasıl okur?**
- Claude Code: `CLAUDE.md` üzerinden `AGENTS.md`'yi otomatik okur. İlk açılışta içeri aktarma onayı sorarsa onaylayın.
- Cursor, GitHub Copilot, Codex: `AGENTS.md`'yi otomatik okur.
- **ChatGPT, Claude veya Gemini'yi web sitesinden/uygulamasından kullanıyorsanız:** bu araçlar repodaki dosyaları görmez. Her yeni sohbetin başında `AGENTS.md`'nin tamamını, ilgili kod dosyalarını ve gerekiyorsa `supabase/01_schema.sql`'i yapıştırın. Yapıştırmazsanız yapay zeka tablo isimlerini uydurur ve kurallara uymaz.

**Dikkat edilmesi gerekenler**
- **Tek oturumda tek iş verin.** "Bütün paneli yap" yerine "randevu listesini göster" gibi küçük ve net görevler daha iyi sonuç verir.
- **Önce plan isteyin.** "Kodu yazmadan önce hangi dosyaları değiştireceğini söyle" demek, ajanın yanlış yere gitmesini erkenden yakalar.
- **Yazılan kodu okuyun.** Anlamadığınız bir kısmı ajana açıklatın. PR'da "bu ne yapıyor?" sorusuna cevap verebilmelisiniz.
- **`git status` ile kontrol edin.** Ajan, sizin alanınız dışında bir dosyayı değiştirdiyse o değişikliği geri alın.
- **Ajan bir anahtar, şifre veya `.env.local` içeriği isterse vermeyin.** Kodun anahtarlara ihtiyacı varsa ortam değişkeninden okur.
- **Hata düzeltmede döngüye girmeyin.** Ajan aynı hatayı 2-3 denemede çözemiyorsa durun, hata mesajını ve ne denendiğini ekibe yazın.
- **Commit'ten önce** `npm run lint` ve `npm run build` çalıştırın.

## Log tutma

Her kişinin kendi dosyası vardır: `logs/sevde.md`, `logs/esma.md` gibi. Herkes yalnızca kendi dosyasına yazar, böylece birleştirmede çakışma olmaz. Ajanlar `AGENTS.md`'deki kural gereği her işin sonunda kaydı kendileri ekler; web sohbeti kullanıyorsanız "bu iş için AGENTS.md'deki formatta bir log kaydı yaz" deyip çıkan metni dosyanıza kendiniz ekleyin. Format ve örnek için `logs/ahmetyasin.md` dosyasına bakın.

## Dal (branch) ve Pull Request nedir?

`main` dalı projenin herkesin kullandığı, her zaman çalışan ana kopyasıdır. Herkes doğrudan `main` üzerinde çalışsaydı, birinin hatalı kodu bütün ekibin projesini bozardı.

Bu yüzden her iş için `main`'in bir kopyası alınır; buna **dal (branch)** denir. Kendi dalınızda istediğiniz gibi çalışırsınız, kimseyi etkilemezsiniz. İşiniz bitince "benim dalımdaki değişiklikleri `main`'e ekleyelim" diye bir istek açarsınız; buna **Pull Request (PR)** denir. Ahmet Yasin değişikliklere bakar, sorun yoksa `main`'e ekler (merge), sorun varsa yorum yazar ve siz aynı dalda düzeltirsiniz.

Kısaca: **dal aç → çalış → gönder → PR aç → onay bekle → birleşir.**

### Adım adım

1. **`main`'i güncelleyin.** Başkalarının eklediği son değişiklikleri alın:
   ```
   git checkout main
   git pull
   ```
2. **Yeni dal açın.** İsim işinizi anlatsın; yeni özellik için `feat/`, hata düzeltmesi için `fix/` ile başlayın:
   ```
   git checkout -b feat/admin-onay
   ```
3. **Çalışın.** Ajanınızla işi yapın, kodu okuyun, deneyin.
4. **Kontrol edin.** `git status` ile değişen dosyalara bakın; sadece kendi alanınızdaki dosyalar ve kendi log dosyanız görünmeli. Sonra `npm run lint` ve `npm run build` çalıştırın, ikisi de hatasız bitmeli.
5. **Kaydedin (commit) ve gönderin (push):**
   ```
   git add .
   git commit -m "feat(admin): randevu onay ve red butonları eklendi"
   git push -u origin feat/admin-onay
   ```
6. **PR'ı açın.** GitHub'da repoya girin; üstte çıkan **"Compare & pull request"** butonuna basın (çıkmazsa *Pull requests → New pull request*, sonra kendi dalınızı seçin). Hedef dalın `main` olduğundan emin olun.
7. **Açıklamayı doldurun** ve **Create pull request**'e basın:
   ```
   ## Ne yaptım
   Randevu listesine onay ve red butonları ekledim.

   ## Nasıl test ettim
   Sahte bir randevu oluşturup panelden onayladım, durumu "Onaylandı" oldu.

   ## Ekran görüntüsü (arayüz değiştiyse)

   ## Bilinen eksikler
   Red sebebi yazma alanı henüz yok.
   ```
8. **Onayı bekleyin.** Ahmet Yasin yorum yazarsa aynı dalda düzeltin, tekrar commit ve push yapın. Yeni PR açmanıza gerek yok, mevcut PR kendiliğinden güncellenir.
9. **Birleştikten sonra** `main`'e dönüp güncelleyin (1. adım) ve bir sonraki iş için yeni bir dal açın. Birleşmiş dalda çalışmaya devam etmeyin.

### Dikkat edilecekler

- **Bir PR, bir iş.** Küçük PR'lar hızlı incelenir ve hızlı birleşir. Üç farklı işi tek PR'a koymayın.
- **PR'ı kendiniz birleştirmeyin.** Merge butonuna sadece Ahmet Yasin basar.
- **`.env.local` ve anahtarlar asla PR'a girmez.** `git status`'ta görürseniz durun ve haber verin.
- **"Conflict" (çakışma) uyarısı** çıkarsa, aynı dosyanın aynı yerini iki kişi değiştirmiş demektir. Rastgele çözmeye çalışmayın; ne olduğunu yazıp Ahmet Yasin'e haber verin.
- **İşiniz uzun sürerse** arada `main`'deki yenilikleri dalınıza alın: kendi dalınızdayken `git pull origin main`.
- **Terminal size zor geliyorsa** VS Code'un kaynak kontrolü (Source Control) sekmesi veya GitHub Desktop aynı adımları butonlarla yapmanızı sağlar.
- **Takıldığınızda** ajanınıza "bu git hatası ne demek, neyi yanlış yaptım?" diye sorabilirsiniz; ama `--force` veya `reset --hard` içeren bir komut önerirse çalıştırmadan önce Ahmet Yasin'e sorun, bu komutlar iş kaybettirebilir.

## WhatsApp test numaraları

Bot, Meta'nın test numarasıyla çalışır ve yalnızca kayıtlı 5 numaraya cevap verir. Bu numaralar dışındaki telefonlarla bota mesaj atılırsa cevap gelmez; bu bir hata değildir. Bot testleri bu numaralar üzerinden yapılır.

## Kapsam dışı

Hatırlatma mesajları, birden fazla klinik, online ödeme, hasta hesabı ve panelde birden fazla kullanıcı bu projenin kapsamında değildir.

## Sorun olduğunda

Takıldığınız yeri, hata mesajını ve ne denediğinizi grup üzerinden Ahmet Yasin'e yazın. Kurallarda yanlış veya eksik gördüğünüz bir şey varsa `AGENTS.md`'yi kendiniz değiştirmeyin, haber verin.
