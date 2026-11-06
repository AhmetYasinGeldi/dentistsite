import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Diş Kliniği",
  description: "WhatsApp randevu sisteminde hangi bilgilerin neden işlendiği.",
};

// Meta uygulama ayarlarındaki "Privacy policy URL" ve "User data deletion URL" bu sayfayı gösterir.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-foreground">
      <Link href="/" className="text-sm text-primary hover:underline">
        ← Ana sayfaya dön
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Gizlilik Politikası</h1>
      <p className="mt-2 text-sm text-foreground/60">Son güncelleme: 2 Kasım 2026</p>

      <div className="mt-8 space-y-8 leading-relaxed">
        <section>
          <p>
            Bu sayfa, kliniğimizin WhatsApp üzerinden çalışan randevu sisteminde hangi
            bilgileri, hangi amaçla işlediğini anlatır. Bilgileriniz 6698 sayılı Kişisel
            Verilerin Korunması Kanunu (KVKK) kapsamında işlenir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Hangi bilgileri topluyoruz?</h2>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>WhatsApp telefon numaranız</li>
            <li>Bize yazdığınız ad ve soyad</li>
            <li>WhatsApp üzerinden gönderdiğiniz mesajlar</li>
            <li>Randevu bilgileriniz: seçtiğiniz işlem, doktor, tarih ve saat</li>
          </ul>
          <p className="mt-3">
            Sağlık geçmişi, ödeme bilgisi veya kimlik numarası istemiyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Bu bilgileri ne için kullanıyoruz?</h2>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Randevu talebinizi almak, onaylamak, iptal etmek veya ertelemek</li>
            <li>Randevunuzla ilgili size WhatsApp üzerinden bilgi vermek</li>
            <li>Yazdığınız mesajı anlayıp size doğru seçenekleri sunmak</li>
          </ul>
          <p className="mt-3">
            Bilgilerinizi reklam veya pazarlama amacıyla kullanmıyor, satmıyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Bilgileriniz kimlerle paylaşılır?</h2>
          <p className="mt-3">
            Sistemin çalışması için aşağıdaki hizmet sağlayıcıları kullanıyoruz:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Meta (WhatsApp Business Platform): mesajların iletilmesi</li>
            <li>Supabase: randevu ve mesaj kayıtlarının saklanması</li>
            <li>Vercel: sitenin ve sistemin barındırılması</li>
            <li>
              Google (Gemini): serbest yazdığınız mesajın anlamlandırılması. Bu hizmete
              yalnızca mesaj metni gönderilir; adınız ve telefon numaranız gönderilmez.
            </li>
          </ul>
          <p className="mt-3">
            Bu sağlayıcıların sunucuları yurt dışında bulunabilir. Bilgilerinize klinikte
            yalnızca randevuları yöneten yetkili personel erişir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Ne kadar süre saklıyoruz?</h2>
          <p className="mt-3">
            Randevu ve mesaj kayıtlarını, randevu hizmetini sunmak ve yasal
            yükümlülüklerimizi yerine getirmek için gerekli olduğu süre boyunca saklarız.
            Bu süre sona erdiğinde kayıtlar silinir veya anonim hale getirilir.
          </p>
        </section>

        <section id="veri-silme">
          <h2 className="text-xl font-semibold">Verilerinizin silinmesi ve haklarınız</h2>
          <p className="mt-3">
            KVKK&apos;nın 11. maddesi uyarınca bilgilerinizin işlenip işlenmediğini öğrenme,
            düzeltilmesini veya silinmesini isteme hakkınız vardır.
          </p>
          <p className="mt-3">Bilgilerinizin silinmesini istiyorsanız:</p>
          <ol className="mt-3 list-decimal space-y-1 pl-6">
            <li>
              Kliniğimize WhatsApp hattımızdan veya telefonla ulaşın ve silme talebinizi
              iletin.
            </li>
            <li>Talebi, kayıtlı WhatsApp numaranızla eşleştirerek doğrularız.</li>
            <li>
              Hasta kaydınız, randevularınız ve mesaj geçmişiniz en geç 30 gün içinde
              silinir ve size bilgi verilir.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Değişiklikler</h2>
          <p className="mt-3">
            Bu politikayı güncellediğimizde yeni hali bu sayfada yayımlanır ve üstteki
            tarih değişir.
          </p>
        </section>
      </div>
    </main>
  );
}
