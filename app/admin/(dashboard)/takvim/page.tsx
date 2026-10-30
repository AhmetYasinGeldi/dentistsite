import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Takvim | Klinik Yönetim Paneli",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-foreground/10 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Takvim
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Doktor bazlı günlük ve haftalık randevu ajandası
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-foreground/20 bg-background p-12 text-center">
        <h3 className="text-sm font-semibold text-foreground">
          Takvim Görünümü Yakında
        </h3>
        <p className="mt-1 text-xs text-foreground/60">
          Takvim modülü ilgili görev kartında geliştirilecektir.
        </p>
      </div>
    </div>
  );
}

