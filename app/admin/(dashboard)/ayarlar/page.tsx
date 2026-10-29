import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayarlar | Klinik Yönetim Paneli",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Klinik Ayarları
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Çalışma saatleri, doktorlar ve işlem süreleri yönetimi
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-sm font-semibold text-foreground">
          Ayarlar Modülü Yakında
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Klinik ayarları modülü ilgili görev kartında geliştirilecektir.
        </p>
      </div>
    </div>
  );
}

