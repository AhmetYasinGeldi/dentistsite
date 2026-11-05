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
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Uzman Hekim Kadromuz
          </h2>
          <p className="text-foreground/70">Bilgiler şu an yüklenemedi.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
          Uzman Hekim Kadromuz
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors?.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-background rounded-2xl shadow-sm border border-secondary p-6 text-center"
            >
              {doctor.photo_url ? (
                <div className="w-32 h-32 mx-auto mb-4 overflow-hidden rounded-full border-4 border-primary/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doctor.photo_url}
                    alt={`${doctor.title} ${doctor.full_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full mb-4 flex items-center justify-center text-primary border-4 border-primary/20">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground">
                {doctor.title} {doctor.full_name}
              </h3>
              <p className="text-primary font-medium mt-1 mb-3">
                {doctor.specialty}
              </p>
              {doctor.bio && (
                <p className="text-foreground/70 text-sm line-clamp-4">
                  {doctor.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
