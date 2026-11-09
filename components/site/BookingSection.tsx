import { createPublicClient } from "@/lib/supabase/public";
import QuickBookingCard from "@/components/site/QuickBookingCard";

export default async function BookingSection() {
  const supabase = createPublicClient();
  const { data: procedures, error } = await supabase
    .from("procedures")
    .select("id, name, duration_minutes")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[site] randevu formu için işlemler alınamadı", error);
  }

  const phoneNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
    /\D/g,
    "",
  );

  return (
    <section
      id="randevu"
      className="scroll-mt-20 border-t border-border bg-surface/35 py-16 px-4 sm:py-20"
    >
      <div className="mx-auto max-w-6xl sm:px-2">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              WhatsApp ile Randevu
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              İstediğiniz işlemi seçerek WhatsApp sohbetini başlatabilir veya
              doğrudan hattımıza yazarak müsait gün ve saatleri
              görüntüleyebilirsiniz.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <li>
                • Sohbette <strong className="text-foreground">menü</strong>{" "}
                yazarak istediğiniz adımda ana menüye dönebilirsiniz.
              </li>
              <li>
                • Aktif randevunuzu aynı numara üzerinden görüntüleyebilir,
                erteleyebilir veya iptal edebilirsiniz.
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <QuickBookingCard
              procedures={procedures ?? []}
              phoneNumber={phoneNumber}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
