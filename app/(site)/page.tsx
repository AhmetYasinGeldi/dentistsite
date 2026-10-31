// app/(site)/page.tsx veya app/page.tsx

import HeroSection from "@/components/site/HeroSection";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Sitenin en üst karşılama alanı ve butonu */}
      <HeroSection />
      
      {/* İlerleyen aşamalarda Ahmet Çiçek ve Ömer'in yapacağı Doktorlar ve Tedaviler bölümleri buraya eklenecek */}
    </main>
  );
}