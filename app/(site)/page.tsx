import HeroSection from "@/components/site/HeroSection";
import Doctors from "@/components/site/Doctors";
import Treatments from "@/components/site/Treatments";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <Treatments />
      <Doctors />
    </main>
  );
}