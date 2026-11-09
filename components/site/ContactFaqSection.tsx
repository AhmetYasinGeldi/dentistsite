import { createPublicClient } from "@/lib/supabase/public";
import { formatPhone } from "@/lib/shared/phone";

const DAY_NAMES: Record<number, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
  6: "Cumartesi",
  7: "Pazar",
};

function shortTime(timeStr: string | null): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

export default async function ContactFaqSection() {
  const supabase = createPublicClient();

  const [
    { data: settings, error: settingsError },
    { data: hours, error: hoursError },
  ] = await Promise.all([
    supabase
      .from("clinic_settings")
      .select(
        "clinic_name, phone, address, cancel_limit_hours, booking_window_days",
      )
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("working_hours")
      .select(
        "day_of_week, is_open, open_time, close_time, break_start, break_end",
      )
      .order("day_of_week", { ascending: true }),
  ]);

  if (settingsError) {
    console.error("[site] klinik ayarları alınamadı", settingsError);
  }
  if (hoursError) {
    console.error("[site] çalışma saatleri alınamadı", hoursError);
  }

  const cancelLimitHours = settings?.cancel_limit_hours ?? 2;
  const bookingWindowDays = settings?.booking_window_days ?? 30;
  const formattedPhone = settings?.phone ? formatPhone(settings.phone) : null;
  const addressText = settings?.address ?? null;

  const faqItems = [
    {
      question: "WhatsApp üzerinden nasıl randevu alabilirim?",
      answer:
        "Sitedeki WhatsApp butonuna tıkladığınızda açılan sohbette işlem, hekim, tarih ve saat seçerek talebinizi iletebilirsiniz.",
    },
    {
      question: "Randevu talebim ne zaman kesinleşir?",
      answer:
        "Talebiniz oluşturulduğunda seçtiğiniz saat sizin için ayrılır. Klinik onayladığında WhatsApp üzerinden bilgilendirme mesajı gönderilir.",
    },
    {
      question: "Randevumu iptal edebilir veya erteleyebilir miyim?",
      answer: `WhatsApp hattımıza "menü" yazarak randevu saatinize ${cancelLimitHours} saat kalana kadar iptal veya erteleme yapabilirsiniz. Daha az süre kaldıysa kliniğimizi doğrudan aramanız gerekir.`,
    },
    {
      question: "Ne kadar ileri tarihe randevu veriliyor?",
      answer: `Bugünden itibaren önümüzdeki ${bookingWindowDays} gün içindeki açık çalışma günlerimiz için randevu talebi oluşturabilirsiniz.`,
    },
  ];

  return (
    <section
      id="iletisim"
      className="scroll-mt-20 border-t border-border bg-background py-16 px-4 sm:py-20"
    >
      <div className="mx-auto max-w-6xl sm:px-2">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Sol Sütun: Çalışma Saatleri ve İletişim */}
          <div className="space-y-8 lg:col-span-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                Çalışma Saatleri ve İletişim
              </h2>
              {(addressText || formattedPhone) && (
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {addressText && (
                    <p>
                      <strong className="font-semibold text-foreground">
                        Adres:{" "}
                      </strong>
                      {addressText}
                    </p>
                  )}
                  {formattedPhone && (
                    <p>
                      <strong className="font-semibold text-foreground">
                        Telefon:{" "}
                      </strong>
                      <a
                        href={`tel:+${settings?.phone}`}
                        className="text-sea hover:underline"
                      >
                        {formattedPhone}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-brand border border-border bg-surface/30 p-5">
              <h3 className="text-base font-bold text-foreground">
                Haftalık Çalışma Saatleri
              </h3>
              {hours && hours.length > 0 ? (
                <ul className="mt-3 divide-y divide-border text-sm">
                  {hours.map((row) => (
                    <li
                      key={row.day_of_week}
                      className="flex items-center justify-between py-2.5"
                    >
                      <span className="text-foreground">
                        {DAY_NAMES[row.day_of_week] ?? `Gün ${row.day_of_week}`}
                      </span>
                      {row.is_open ? (
                        <div className="text-right">
                          <span className="font-medium text-olive-dark">
                            {shortTime(row.open_time)} –{" "}
                            {shortTime(row.close_time)}
                          </span>
                          {row.break_start && row.break_end && (
                            <span className="block text-xs text-muted-foreground">
                              Ara: {shortTime(row.break_start)} –{" "}
                              {shortTime(row.break_end)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Kapalı
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Çalışma saatleri şu an görüntülenemiyor.
                </p>
              )}
            </div>
          </div>

          {/* Sağ Sütun: Sıkça Sorulan Sorular */}
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Sıkça Sorulan Sorular
            </h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {faqItems.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground">
                    <span>{faq.question}</span>
                    <span className="text-muted-foreground transition-transform group-open:rotate-180">
                      ↓
                    </span>
                  </summary>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
