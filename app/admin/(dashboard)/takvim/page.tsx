import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Takvim | Klinik Yönetim Paneli",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Takvim
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Doktor bazlı günlük ve haftalık randevu ajandası
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-sm font-semibold text-foreground">
          Takvim Görünümü Yakında
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Takvim modülü ilgili görev kartında geliştirilecektir.
        </p>
      </div>
    </div>
  );
}

