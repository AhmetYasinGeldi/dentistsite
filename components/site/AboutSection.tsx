const CLINIC_PRINCIPLES = [
  {
    title: "Randevulu Çalışma Düzeni",
    description:
      "Bekleme süresini en aza indirmek için her işlem türüne özel seans süreleriyle planlı randevu sistemi uyguluyoruz.",
  },
  {
    title: "Birebir Hekim Seçimi",
    description:
      "Genel diş hekimliği, ortodonti, endodonti ve çene cerrahisi branşlarında doğrudan işlemi uygulayan hekimden randevu talep edebilirsiniz.",
  },
  {
    title: "Şeffaf Bilgilendirme",
    description:
      "Muayene sonrasında uygulanacak tedavi adımları ve seans planlaması hakkında işlem öncesinde açık bilgi paylaşıyoruz.",
  },
];

export default function AboutSection() {
  return (
    <section
      id="hakkimizda"
      className="scroll-mt-20 border-t border-border bg-background py-16 px-4 sm:py-20"
    >
      <div className="mx-auto max-w-6xl sm:px-2">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Klinik Hakkında
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              ZB Dentist Ağız ve Diş Sağlığı Kliniği, rutin diş kontrollerinden
              uzmanlık gerektiren kanal, ortodonti ve cerrahi işlemlere kadar
              tüm tedavileri tek çatı altında sunar.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Randevu süreçlerimizi telefon trafiğine gerek kalmadan WhatsApp
              üzerinden yürütüyor; onay, iptal ve erteleme işlemlerini hızlıca
              tamamlamanızı sağlıyoruz.
            </p>
          </div>

          <div className="divide-y divide-border border-y border-border lg:col-span-7">
            {CLINIC_PRINCIPLES.map((item) => (
              <div key={item.title} className="py-5 first:pt-4 last:pb-4">
                <h3 className="text-base font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
