import { createPublicClient } from '@/lib/supabase/public';

// TypeScript için veritabanından gelecek tedavi ve doktor tiplerini tanımlıyoruz
type DoctorData = {
  id: string;
  title: string;
  full_name: string;
  is_active: boolean;
};

type TreatmentData = {
  id: string;
  name: string;
  duration_minutes: number;
  description: string;
  doctor_procedures: { doctors: DoctorData }[];
};

export default async function Treatments() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('procedures')
    .select(`id, name, duration_minutes, description, doctor_procedures(doctors(id, title, full_name, is_active))`)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Veriyi oluşturduğumuz tipe dönüştürüyoruz
  const treatments = data as unknown as TreatmentData[];

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Tedavilerimiz</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {treatments?.map((treatment) => {
            const activeDoctors = treatment.doctor_procedures
              ?.map((dp) => dp.doctors)
              .filter((doc) => doc && doc.is_active);

            return (
              <div key={treatment.id} className="p-6 rounded-2xl border bg-card">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-primary">{treatment.name}</h3>
                  <span className="text-xs font-medium bg-secondary px-2.5 py-0.5 rounded-full">~{treatment.duration_minutes} dk</span>
                </div>
                <p className="text-muted-foreground mb-4 line-clamp-3">{treatment.description}</p>
                {activeDoctors?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                    {activeDoctors.map((doc) => (
                      <span key={doc.id} className="px-2 py-1 rounded-md text-xs bg-muted">{doc.title} {doc.full_name}</span>
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