import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayarlar | Klinik Yönetim Paneli",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-foreground/10 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Klinik Ayarları
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Çalışma saatleri, doktorlar ve işlem süreleri yönetimi
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-foreground/20 bg-background p-12 text-center">
        <h3 className="text-sm font-semibold text-foreground">
          Ayarlar Modülü Yakında
        </h3>
        <p className="mt-1 text-xs text-foreground/60">
          Klinik ayarları modülü ilgili görev kartında geliştirilecektir.
        </p>
      </div>
    </div>
  );
}

