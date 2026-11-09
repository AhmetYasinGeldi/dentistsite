import { createPublicClient } from "@/lib/supabase/public";

export default async function Doctors() {
  const supabase = createPublicClient();
  const { data: doctors, error } = await supabase
    .from("doctors")
    .select("id, title, full_name, specialty, bio, photo_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[site] doktorlar alınamadı", error);
    return (
      <section
        id="hekimler"
        className="scroll-mt-20 border-t border-border bg-surface/25 py-16 px-4"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            Hekim Kadromuz
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
      id="hekimler"
      className="scroll-mt-20 border-t border-border bg-surface/25 py-16 px-4 sm:py-20"
    >
      <div className="mx-auto max-w-6xl sm:px-2">
        <div className="mb-10 border-b border-border pb-6">
          <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Hekim Kadromuz
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Muayene ve tedavilerinizi gerçekleştiren diş hekimlerimiz.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors?.map((doctor) => {
            const initials = doctor.full_name
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={doctor.id}
                className="flex flex-col rounded-brand border border-border bg-background p-6"
              >
                <div className="flex items-center gap-4">
                  {doctor.photo_url ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doctor.photo_url}
                        alt={`${doctor.title} ${doctor.full_name}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-bold text-primary"
                    >
                      {initials}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {doctor.title} {doctor.full_name}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-olive-dark">
                      {doctor.specialty}
                    </p>
                  </div>
                </div>

                {doctor.bio && (
                  <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                    {doctor.bio}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
