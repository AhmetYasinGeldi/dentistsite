import { Suspense } from "react";
import HeroSection from "@/components/site/HeroSection";
import Doctors from "@/components/site/Doctors";
import Treatments from "@/components/site/Treatments";

function TreatmentsSkeleton() {
  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="h-10 w-64 bg-muted rounded-lg mx-auto mb-12 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl border border-secondary bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DoctorsSkeleton() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="h-10 w-72 bg-muted rounded-lg mx-auto mb-12 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 rounded-2xl border border-secondary bg-background p-6 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <Suspense fallback={<TreatmentsSkeleton />}>
        <Treatments />
      </Suspense>
      <Suspense fallback={<DoctorsSkeleton />}>
        <Doctors />
      </Suspense>
    </main>
  );
}
