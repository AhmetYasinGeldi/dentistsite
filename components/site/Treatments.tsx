import { createPublicClient } from "@/lib/supabase/public";

export default async function Treatments() {
  const supabase = createPublicClient();
  const { data: treatments, error } = await supabase
    .from("procedures")
    .select(
      "id, name, duration_minutes, description, doctor_procedures(doctors(id, title, full_name, is_active))",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[site] tedaviler alınamadı", error);
    return (
      <section id="tedaviler" className="scroll-mt-20 bg-background py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            Tedavilerimiz
          </h2>
          <p className="mt-2 text-muted-foreground">
            Bilgiler şu an yüklenemedi.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="tedaviler"
      className="scroll-mt-20 bg-background py-16 px-4 sm:py-20"
    >
      <div className="mx-auto max-w-6xl sm:px-2">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Tedavilerimiz
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
              Kliniğimizde uygulanan işlemler, ortalama seans süreleri ve ilgili
              hekimlerimiz.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Toplam {treatments?.length ?? 0} aktif işlem
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {treatments?.map((treatment) => {
            const activeDoctors = (treatment.doctor_procedures ?? []).flatMap(
              (dp) => (dp.doctors && dp.doctors.is_active ? [dp.doctors] : []),
            );

            return (
              <div
                key={treatment.id}
                className="flex flex-col justify-between rounded-brand border border-border bg-surface/30 p-5 transition-colors hover:border-primary/30 hover:bg-surface/50"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-bold text-primary">
                      {treatment.name}
                    </h3>
                    <span className="shrink-0 text-xs font-medium text-olive-dark">
                      ~{treatment.duration_minutes} dk
                    </span>
                  </div>

                  {treatment.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {treatment.description}
                    </p>
                  )}
                </div>

                {activeDoctors.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                    {activeDoctors.map((doc) => (
                      <span
                        key={doc.id}
                        className="rounded-md border border-border bg-background px-2.5 py-0.5 text-xs text-foreground"
                      >
                        {doc.title} {doc.full_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
