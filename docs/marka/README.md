# ZB Dentist — Logo Paketi

Bu paket, ZB Dentist sitesi için seçilen **"Yaprak Diş"** logosunu içerir. İki zeytin yaprağı birleşerek bir diş oluşturur: sol yaprak zeytin yeşili (`#5E8C31`), sağ yaprak deniz turkuazıdır (`#0E7C86`). Renklerin tamamı aşağıdaki "Logo renkleri" tablosunda. Zeytin motifi, Zeytinburnu adından esinlenmiştir.

> Not: ZB Dentist, proje kapsamında oluşturulmuş kurgusal bir kliniktir. Logo, Zeytinburnu Belediyesi amblemini kopyalamaz; yalnızca zeytin motifi yorumlanmıştır.

Logodaki yazılar vektöre (path) çevrilmiştir. Bu yüzden bilgisayarda Outfit fontu yüklü olmasa da logo her yerde aynı görünür.

---

## Dosyalar ve kullanım yerleri

### SVG dosyaları (öncelikle bunları kullanın)

| Dosya | Ne içeriyor | Nerede kullanılır |
|---|---|---|
| `zb-dentist-logo-renkli.svg` | İşaret + "ZB Dentist" + "Ağız ve Diş Sağlığı" | Açık zeminde ana logo: header/navbar, e-posta imzası, belgeler |
| `zb-dentist-logo-beyaz.svg` | Aynı logo, koyu zemin renkleriyle | Koyu zeminde: footer, petrol (`#0E4D5C`) renkli bölümler, hero görselinin üstü |
| `zb-dentist-isaret-renkli.svg` | Sadece diş işareti, yazı yok | Mobil navbar, yükleme ekranı, küçük alanlar, admin paneli kenar çubuğu |
| `zb-dentist-isaret-beyaz.svg` | Sadece işaret, koyu zemin renkleriyle | Koyu zeminde küçük kullanımlar |
| `favicon.svg` | Damarsız, sadeleştirilmiş işaret | Tarayıcı sekmesi ikonu (modern tarayıcılar) |
| `app-ikon.svg` | Beyaz yuvarlak köşeli zemin üzerinde işaret | Uygulama ikonu kaynağı, sosyal medya profil görseli |

### Diğer dosyalar

| Dosya | Nerede kullanılır |
|---|---|
| `favicon.ico` | Eski tarayıcılar için favicon (16, 32 ve 48 px içerir) |
| `png/favicon-32.png` | PNG favicon gereken yerler |
| `png/icon-192.png` | PWA / `manifest.json` ikonu |
| `png/icon-512.png` | PWA / `manifest.json` ikonu, Next.js `icon.png` |
| `png/apple-touch-icon.png` | iPhone/iPad ana ekran ikonu (180×180, beyaz zemin) |
| `png/zb-dentist-logo-renkli.png` | SVG desteklemeyen yerler: sunum, Word, WhatsApp profil kapağı vb. |
| `png/zb-dentist-logo-beyaz.png` | Koyu zeminde PNG gereken yerler |
| `png/zb-dentist-isaret-512.png` | WhatsApp Business profil fotoğrafı, sosyal medya avatarı |
| `onizleme.png` | Tüm varyantların önizlemesi (sitede kullanılmaz) |

---

## Next.js projesine yerleştirme

Next.js (App Router), `app/` klasöründeki belirli dosya adlarını otomatik olarak tanır ve gerekli `<link>` etiketlerini kendisi ekler.

```
app/
├── favicon.ico            ← favicon.ico
├── icon.png               ← png/icon-512.png (adını icon.png yapın)
└── apple-icon.png         ← png/apple-touch-icon.png (adını apple-icon.png yapın)

public/
└── logo/
    ├── zb-dentist-logo-renkli.svg
    ├── zb-dentist-logo-beyaz.svg
    ├── zb-dentist-isaret-renkli.svg
    └── zb-dentist-isaret-beyaz.svg
```

Header'da kullanım örneği:

```tsx
import Image from "next/image";

<Image
  src="/logo/zb-dentist-logo-renkli.svg"
  alt="ZB Dentist"
  width={190}
  height={53}
  priority
/>
```

Footer'da (koyu zemin):

```tsx
<Image src="/logo/zb-dentist-logo-beyaz.svg" alt="ZB Dentist" width={160} height={44} />
```

Mobilde yer darsa yatay logo yerine `zb-dentist-isaret-renkli.svg` kullanılabilir.

---

## Kullanım kuralları

- **Minimum boyut:** Yatay logo en az 140 px genişlikte kullanılmalı. Daha küçük alanlarda sadece işareti kullanın.
- **Boşluk:** Logonun çevresinde, en az diş işaretinin yarı genişliği kadar boşluk bırakın.
- **Zemin:** Renkli logo açık zeminde (beyaz, `#F6F8F5`, `#E3EFEA`), beyaz logo koyu zeminde (`#0E4D5C`, `#14232B`) kullanılır.
- **Yapılmaması gerekenler:** Logoyu esnetmeyin, döndürmeyin, renklerini değiştirmeyin, gölge veya efekt eklemeyin, karmaşık fotoğrafların üzerine koymayın.
- **Renkler:** Logo dosyalarındaki renkler aşağıdaki tablodaki gibidir ve değiştirilmez.

### Logo renkleri

| Parça | Renkli logo (açık zemin) | Beyaz logo (koyu zemin) |
|---|---|---|
| Sol yaprak | Zeytin `#5E8C31` | Açık zeytin `#A6C66B` |
| Sağ yaprak | Deniz turkuazı `#0E7C86` | Açık turkuaz `#8FD3D8` |
| Yaprak damarları | Beyaz `#FFFFFF` | Petrol `#0E4D5C` |
| "ZB Dentist" yazısı | Petrol `#0E4D5C` | Beyaz `#FFFFFF` |
| "Ağız ve Diş Sağlığı" yazısı | Gri `#5B6B73` | Beyaz `#FFFFFF` |

Deniz turkuazı (`#0E7C86`) ve açık tonlar yalnızca logoda kullanılır; site temasında yoktur. Sitede ana renk petroldür (`#0E4D5C`).

---

## Site teması

### Renkler

| Ad | Hex | Kullanım |
|---|---|---|
| Petrol | `#0E4D5C` | Ana renk: başlıklar, ana buton, footer |
| Zeytin | `#5E8C31` | İkincil: ikonlar, rozetler, onay durumu |
| Koyu zeytin | `#3F6420` | Yeşil metin ve etiketler |
| Marmara | `#24709F` | Bağlantılar, bilgi kutuları |
| Gün batımı | `#B9531A` | Tek vurgu: kampanya, "yeni" etiketi (az kullanın) |
| Kırık beyaz | `#F6F8F5` | Sayfa zemini |
| Nane | `#E3EFEA` | Kart ve bölüm zeminleri |
| Mürekkep | `#14232B` | Gövde metni |
| Gri | `#5B6B73` | İkincil metin, açıklamalar |
| Kenarlık | `#D6E0DB` | 1 px çizgiler |
| WhatsApp | `#25D366` | Yalnızca WhatsApp butonu (üzerindeki yazı koyu: `#0B2E17`) |

> WhatsApp yeşili üzerinde beyaz yazı okunabilirlik açısından yetersiz kalır, bu yüzden butonda koyu yazı kullanın.

CSS değişkenleri olarak:

```css
:root {
  --color-primary: #0E4D5C;
  --color-olive: #5E8C31;
  --color-olive-dark: #3F6420;
  --color-sea: #24709F;
  --color-accent: #B9531A;
  --color-bg: #F6F8F5;
  --color-surface: #E3EFEA;
  --color-text: #14232B;
  --color-muted: #5B6B73;
  --color-border: #D6E0DB;
  --color-whatsapp: #25D366;
  --radius: 14px;
}
```

### Yazı tipleri

- **Başlıklar:** Outfit (600–700)
- **Metin:** Inter (400–600)

İkisi de Google Fonts'ta ücretsizdir ve Türkçe karakterleri destekler. Next.js'te `next/font/google` ile eklenebilir:

```tsx
import { Outfit, Inter } from "next/font/google";

const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-body" });
```

> `latin-ext` alt kümesi Ğ, Ş, İ gibi Türkçe karakterler için gereklidir.

### Boyut ölçeği

| Öğe | Boyut |
|---|---|
| H1 | 48 px |
| H2 | 32 px |
| H3 | 22 px |
| Gövde | 16–17 px |
| Küçük metin | 13 px |

### Genel stil

- Köşe yuvarlaklığı: 14 px
- Gölge yok ya da çok hafif; ayrım için 1 px `#D6E0DB` kenarlık kullanın
- Butonlar en az 44 px yüksekliğinde olmalı (mobilde dokunma kolaylığı için)
