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
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Tedavilerimiz
          </h2>
          <p className="text-foreground/70">Bilgiler şu an yüklenemedi.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
          Tedavilerimiz
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {treatments?.map((treatment) => {
            const activeDoctors = (treatment.doctor_procedures ?? []).flatMap(
              (dp) => (dp.doctors && dp.doctors.is_active ? [dp.doctors] : []),
            );

            return (
              <div
                key={treatment.id}
                className="p-6 rounded-2xl border border-secondary bg-background"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-primary">
                    {treatment.name}
                  </h3>
                  <span className="text-xs font-medium bg-secondary text-foreground px-2.5 py-0.5 rounded-full">
                    ~{treatment.duration_minutes} dk
                  </span>
                </div>
                {treatment.description && (
                  <p className="text-foreground/70 mb-4 line-clamp-3">
                    {treatment.description}
                  </p>
                )}
                {activeDoctors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-secondary flex flex-wrap gap-2">
                    {activeDoctors.map((doc) => (
                      <span
                        key={doc.id}
                        className="px-2 py-1 rounded-md text-xs bg-muted text-foreground"
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
