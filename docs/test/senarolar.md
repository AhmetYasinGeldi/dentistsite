# Test Senaryoları

Bu dosya Bot, Panel ve Site için test senaryolarını içerir. Her senaryoda adımlar ve beklenen sonuç yazılıdır. Beklenen sonuçlar `AGENTS.md` ve `README.md`'ye göre hazırlanmıştır.

Genel notlar:
- Testlerde yalnızca sahte isimler kullanılır (ör. "Test Hasta 1").
- Bot testleri yalnızca Meta'da kayıtlı 5 test numarasından yapılır. Başka numaralardan cevap gelmemesi hata değildir.
- Hastaya giden bildirim, hastanın son mesajından sonraki 24 saat içinde gönderilebilir.

---

## Bot

### B1. Yeni hasta randevu alır
**Adımlar**
1. Sistemde kayıtlı olmayan test numarasından bota "merhaba" yaz.
2. Menüden "Randevu al"ı seç.
3. Ad soyad sorulunca sahte bir isim yaz.
4. İşlem, doktor, tarih ve saati sırayla seç.
5. Özet ekranında "Onayla"ya bas.

**Beklenen sonuç**
- Hasta kaydı oluşur (telefon `905...` biçiminde, başında `+` yok).
- Randevu `pending` (Onay bekliyor) olarak açılır.
- Bot "Talebiniz alındı, klinik onayladığında bilgilendirileceksiniz." der.

### B2. Kayıtlı hasta randevu alır
**Adımlar**
1. Daha önce kaydı olan ve aktif randevusu bulunmayan numaradan "Randevu al"ı seç.
2. İşlem, doktor, tarih ve saati seç, onayla.

**Beklenen sonuç**
- Ad soyad tekrar sorulmaz.
- Randevu `pending` olarak açılır, talep alındı mesajı gelir.

### B3. Aktif randevusu varken yeni randevu almaya çalışır
**Adımlar**
1. Aktif (`pending` veya `approved`) randevusu olan numaradan "Randevu al"ı seç.

**Beklenen sonuç**
- Yeni randevu açılmaz.
- Bot "Zaten aktif bir randevunuz var." der ve randevuyu görüntüle / iptal / ertele seçeneklerini sunar.

### B4. Dolu saati seçer
**Adımlar**
1. Başka bir hastanın aldığı saati (aynı doktor, aynı gün) seçmeye çalış. Aynı saati iki numaradan neredeyse aynı anda seçerek de denenebilir.

**Beklenen sonuç**
- İkinci randevu açılmaz.
- Bot "Bu saat az önce doldu, lütfen başka bir saat seçin." ya da "Seçilen saat müsait değil." der ve başka saat seçtirir.

### B5. "menü" yazarak akıştan çıkar
**Adımlar**
1. Randevu akışını başlat, ortada bir adımda (ör. tarih seçimi) dur.
2. "menü" yaz.

**Beklenen sonuç**
- Ana menü gelir (Randevu al · Randevumu gör · İptal / Ertele).
- Yarım kalan randevu oluşmaz.

### B6. Randevusunu görür
**Adımlar**
1. Aktif randevusu olan numaradan menüde "Randevumu gör"ü seç.

**Beklenen sonuç**
- Tarih, saat, doktor, işlem ve durum doğru gösterilir (ör. "5 Kasım 2026 Perşembe, 10:30", "Onay bekliyor").
- Tarih/saat İstanbul saatine göredir.

### B7. Randevusunu iptal eder
**Adımlar**
1. Randevusuna iptal sınırından (`cancel_limit_hours`, varsayılan 2 saat) fazla zaman olan bir hastayla menüden iptal et.
2. Onayla.

**Beklenen sonuç**
- Randevu `cancelled` olur, iptal eden `patient` görünür.
- Saat tekrar boşalır (müsait saatlerde görünür).
- Hastaya iptal onayı gelir.

### B8. 2 saatten az kala iptal etmeye çalışır
**Adımlar**
1. Randevusuna iptal sınırından az süre kalmış bir hastayla iptal etmeyi dene.

**Beklenen sonuç**
- Randevu iptal edilmez.
- Bot "lütfen kliniği arayın" der ve klinik telefonunu önerir.

### B9. Randevusunu erteler
**Adımlar**
1. Randevusuna sınırdan fazla zaman olan bir hastayla menüden "Ertele"yi seç.
2. Yeni tarih ve saat seç, onayla.

**Beklenen sonuç**
- Eski randevu iptal edilir, yeni randevu `pending` açılır; ikisi tek işlemde yapılır.
- Hastaya yeni talep mesajı gelir.
- Sınırdan az kala erteleme B8 gibi reddedilir.

### B10. Serbest metin yazar
**Adımlar**
1. Bota "yarın öğleden sonra dolgu" yaz.

**Beklenen sonuç**
- Bot işlemi (Dolgu) ve zaman dilimini (yarın, öğleden sonra) anlar; yarın İstanbul saatine göre hesaplanır.
- Randevu akışına uygun adımdan devam eder; müsait saatleri veritabanından gösterir.
- Anlayamazsa butonlu menüye döner, çökmez.

### B11. Anlamsız mesaj yazar
**Adımlar**
1. Bota "asdfgh" gibi anlamsız bir metin yaz.

**Beklenen sonuç**
- Bot nazikçe yardım edemediğini söyler ve menüyü gösterir.
- Hata mesajı ya da çökme olmaz.

### B12. Resim gönderir
**Adımlar**
1. Bota bir fotoğraf gönder.

**Beklenen sonuç**
- Bot çökmez.
- Görselleri işleyemediğini belirtip menüye ya da yönlendirmeye döner.

### B13. Aynı mesaj iki kez gelir
**Adımlar**
1. Meta aynı mesajı tekrar gönderirse (ya da aynı webhook isteği yeniden gönderilirse) davranışı izle.

**Beklenen sonuç**
- Mesaj ikinci kez işlenmez, çift randevu oluşmaz.
- Webhook yine 200 döner.

### B14. Çok sayıda boş saat
**Adımlar**
1. Bir günde 10'dan fazla boş saati olan bir doktor ve tarih seç.

**Beklenen sonuç**
- Bot saatleri sınır aşılmadan gösterir (sayfalama ya da sabah/öğleden sonra ayrımı).
- Liste mesajında en fazla 10 satır olur, mesaj hatasız gider.

---

## Panel

### P1. Giriş ve çıkış
**Adımlar**
1. `/admin/login` sayfasında yanlış şifre dene.
2. Doğru bilgilerle giriş yap.
3. Çıkış yap, tarayıcıda geri tuşuna bas.

**Beklenen sonuç**
- Yanlış şifrede anlaşılır bir hata mesajı çıkar.
- Doğru bilgilerle panele girilir.
- Çıkıştan sonra geri tuşuyla panel verisine ulaşılamaz.

### P2. Girişsiz /admin
**Adımlar**
1. Giriş yapmamışken tarayıcıya `/admin` adresini yaz.

**Beklenen sonuç**
- `/admin/login` sayfasına yönlendirilir.
- Hiçbir randevu ya da hasta verisi görünmez.

### P3. Randevuyu onaylar
**Adımlar**
1. Giriş yap, "Onay bekliyor" durumundaki bir randevuyu seç.
2. Onayla.

**Beklenen sonuç**
- Randevu `approved` (Onaylandı) olur.
- Hastaya WhatsApp bildirimi gider.
- Hastanın son mesajından 24 saatten fazla geçtiyse bildirim gitmez ve panel "Hastaya WhatsApp bildirimi gönderilemedi" uyarısı gösterir.

### P4. Randevuyu reddeder (sebepli)
**Adımlar**
1. Bekleyen bir randevuyu seç, red sebebi yaz ve reddet.

**Beklenen sonuç**
- Randevu `rejected` (Reddedildi) olur, saat tekrar boşalır.
- Hastaya sebebiyle birlikte WhatsApp bildirimi gider (24 saat kuralı P3'teki gibi).
- Sebep boş bırakılırsa işlem engellenir.

### P5. Elle randevu ekler (yeni hasta)
**Adımlar**
1. "Elle randevu ekle"yi aç.
2. Sistemde olmayan sahte bir telefon numarası ve isim gir.
3. İşlem, doktor ve `get_available_slots` ile gelen boş saatlerden birini seç, kaydet.

**Beklenen sonuç**
- Yeni hasta oluşur, telefon `905...` biçiminde (başında `+` yok) kaydedilir.
- Randevu doğrudan `approved` açılır, kaynağı `admin` olur.
- Randevu listede görünür.

### P6. Elle randevu ekler (kayıtlı hasta)
**Adımlar**
1. "Elle randevu ekle"yi aç, kayıtlı bir hastanın telefonunu gir.
2. İşlem, doktor ve saati seç, kaydet.

**Beklenen sonuç**
- Mevcut hasta bulunur, ikinci hasta kaydı oluşmaz.
- Randevu `approved` açılır.
- Hastanın zaten aktif randevusu varsa anlaşılır bir hata gösterilir.

### P7. Randevuyu iptal eder
**Adımlar**
1. Onaylı bir randevuyu seç, iptal et.

**Beklenen sonuç**
- Randevu `cancelled` olur, iptal eden `admin` görünür.
- Saat tekrar boşalır.
- Hastaya WhatsApp bildirimi gider (24 saat kuralı geçerli).
- Panelde 2 saat sınırı uygulanmaz.

### P8. Randevuyu erteler
**Adımlar**
1. Bir randevuyu seç, yeni tarih ve saat seçerek ertele.

**Beklenen sonuç**
- Eski randevu iptal edilir, yeni randevu açılır (tek işlemde, `reschedule_appointment`).
- Yeni saat boş olmalıdır; doluysa hata gösterilir.
- Hastaya bilgilendirme gider.

### P9. Doktoru pasifleştirir
**Adımlar**
1. Bir doktoru pasif yap.
2. Siteyi, botu ve elle randevu ekranını kontrol et.

**Beklenen sonuç**
- Doktor sitede listelenmez, botta seçenek olarak çıkmaz, elle randevuda seçilemez.
- Doktorun mevcut randevularına ne olacağı Panel ekibiyle netleştirilmelidir (AGENTS.md'de belirtilmemiş).

### P10. Günü kapatır
**Adımlar**
1. Gelecekte bir günü klinik tatili olarak kapat.
2. O gün için bot ve panelden randevu almayı dene.

**Beklenen sonuç**
- O güne müsait saat gelmez, yeni randevu alınamaz.
- Diğer günler etkilenmez.

### P11. İzin girer
**Adımlar**
1. Bir doktor için tarih aralığında izin gir.
2. O aralıkta o doktora randevu almayı dene.

**Beklenen sonuç**
- O doktor için izin aralığında müsait saat gelmez.
- Diğer doktorlar ve diğer günler etkilenmez.

---

## Site

### S1. WhatsApp butonu
**Adımlar**
1. Ana sayfadaki WhatsApp butonuna tıkla.

**Beklenen sonuç**
- WhatsApp açılır, bağlantı `wa.me/<klinik numarası>` biçimindedir.
- Hazır mesaj "Merhaba, randevu almak istiyorum." şeklindedir.

### S2. Doktor ve tedavi listesi
**Adımlar**
1. Ana sayfada Doktorlar ve Tedaviler bölümlerine bak.
2. Panelden bir doktoru pasif yap, sayfayı yenile.

**Beklenen sonuç**
- Yalnızca aktif doktor ve işlemler listelenir.
- Pasif yapılan doktor listeden kalkar.

### S3. Çalışma saatleri
**Adımlar**
1. İletişim bölümündeki çalışma saatlerine bak, panelde tanımlı saatlerle karşılaştır.

**Beklenen sonuç**
- Gün ve saatler panelde tanımlı çalışma saatleriyle uyumludur.

### S4. Mobil görünüm
**Adımlar**
1. Siteyi telefonda ya da tarayıcının cihaz modunda (`F12`) aç.
2. Tüm bölümleri kaydır.

**Beklenen sonuç**
- Yatay kaydırma ve taşma olmaz.
- WhatsApp butonu görünür ve tıklanabilir, yazılar okunur.
