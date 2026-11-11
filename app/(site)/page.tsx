import { Suspense } from "react";
import Header from "@/components/site/Header";
import HeroSection from "@/components/site/HeroSection";
import AboutSection from "@/components/site/AboutSection";
import Treatments from "@/components/site/Treatments";
import Doctors from "@/components/site/Doctors";
import BookingSection from "@/components/site/BookingSection";
import ContactFaqSection from "@/components/site/ContactFaqSection";
import Footer from "@/components/site/Footer";

function TreatmentsSkeleton() {
  return (
    <section className="bg-background py-16 px-4 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 h-8 w-48 animate-pulse rounded-brand bg-muted" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-brand border border-border bg-surface/40"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DoctorsSkeleton() {
  return (
    <section className="border-t border-border bg-surface/25 py-16 px-4 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 h-8 w-56 animate-pulse rounded-brand bg-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-brand border border-border bg-background p-6"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingSkeleton() {
  return (
    <section className="border-t border-border bg-surface/35 py-16 px-4 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="h-48 animate-pulse rounded-brand bg-background/70 lg:col-span-5" />
          <div className="h-72 animate-pulse rounded-brand border border-border bg-background lg:col-span-7" />
        </div>
      </div>
    </section>
  );
}

function ContactSkeleton() {
  return (
    <section className="border-t border-border bg-background py-16 px-4 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="h-72 animate-pulse rounded-brand border border-border bg-surface/30 lg:col-span-5" />
          <div className="h-72 animate-pulse rounded-brand bg-surface/20 lg:col-span-7" />
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <Suspense fallback={<TreatmentsSkeleton />}>
          <Treatments />
        </Suspense>
        <Suspense fallback={<DoctorsSkeleton />}>
          <Doctors />
        </Suspense>
        <AboutSection />
        <Suspense fallback={<BookingSkeleton />}>
          <BookingSection />
        </Suspense>
        <Suspense fallback={<ContactSkeleton />}>
          <ContactFaqSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
