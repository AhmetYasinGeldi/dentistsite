import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Randevular | Klinik Yönetim Paneli",
};

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Randevular
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bekleyen talepler ve onaylanmış randevuların yönetimi
          </p>
        </div>
      </div>

      {/* Randevu içerik alanı iskeleti */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Randevu Listesi Hazırlanıyor
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Giriş ve panel iskeleti başarıyla kuruldu. Randevu onay/red ve filtreleme özellikleri sonraki görev kartında eklenecektir.
        </p>
      </div>
    </div>
  );
}

