// app/admin/(dashboard)/appointments/page.tsx
"use server";

import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/shared/phone";
import { formatDateTime } from "@/lib/shared/datetime";
import { statusLabel } from "@/lib/shared/appointment-status";

/**
 * Admin paneli randevu listesi.
 * - Onay bekleyen (pending) randevular üstte ve dikkat çekici bir bölüme yerleştirilir.
 * - Diğer randevular tarih, doktor ve durum filtresiyle gösterilir.
 * - Sunucu‑tarafı Supabase oturumlu istemci (lib/supabase/server.ts) kullanılır.
 */
type AppointmentRow = {
  id: number;
  starts_at: string;
  status: string;
  patients: { full_name: string; phone: string };
  procedures: { name: string };
  doctors: { full_name: string };
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  // Başlangıç sorgusu
  let query = supabase
    .from("appointments")
    .select(
      `
        id,
        starts_at,
        status,
        patients!inner(full_name, phone),
        procedures!inner(name),
        doctors!inner(full_name)
      `
    );

  // ----- Filtreler -----
  if (searchParams?.doctorId) {
    const docId = Number(searchParams.doctorId);
    if (!Number.isNaN(docId)) query = query.eq("doctor_id", docId);
  }
  if (searchParams?.date) {
    const d = String(searchParams.date);
    query = query
      .gte("starts_at", `${d}T00:00:00+03:00`)
      .lte("starts_at", `${d}T23:59:59+03:00`);
  }
  if (searchParams?.status) {
    query = query.eq("status", String(searchParams.status));
  }

  const { data: appointments, error } = await query.order("starts_at", {
    ascending: true,
  });

  if (error) {
    console.error("Randevu listesini alırken Supabase hatası:", error);
    return (
      <div className="p-4 text-danger">Randevu listesi alınamadı.</div>
    );
  }

  const pending = appointments?.filter((a) => a.status === "pending") ?? [];
  const others = appointments?.filter((a) => a.status !== "pending") ?? [];

  return (
    <div className="p-4 space-y-8">
      {/* Onay bekleyen randevular */}
      {pending.length > 0 && (
        <section className="bg-muted rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Onay Bekleyen Randevular
          </h2>
          <table className="min-w-full table-auto">
            <thead className="border-b border-foreground/20">
              <tr className="text-left text-foreground/70">
                <th className="py-2 px-3">Hasta</th>
                <th className="py-2 px-3">Telefon</th>
                <th className="py-2 px-3">İşlem</th>
                <th className="py-2 px-3">Doktor</th>
                <th className="py-2 px-3">Tarih‑Saat</th>
                <th className="py-2 px-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => (
                <tr key={a.id} className="border-b border-foreground/10">
                  <td className="py-2 px-3">{a.patients.full_name}</td>
                  <td className="py-2 px-3">
                    {formatPhone(a.patients.phone)}
                  </td>
                  <td className="py-2 px-3">{a.procedures.name}</td>
                  <td className="py-2 px-3">{a.doctors.full_name}</td>
                  <td className="py-2 px-3">
                    {formatDateTime(a.starts_at)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={statusLabel(a.status).className}>
                      {statusLabel(a.status).text}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Filtre formu */}
      <section className="bg-background rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Randevu Filtreleri
        </h2>
        <form
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          action=""
          method="GET"
        >
          <input
            type="date"
            name="date"
            defaultValue={String(searchParams?.date ?? "")}
            className="rounded border border-foreground/20 bg-background p-2"
          />
          <input
            type="number"
            name="doctorId"
            placeholder="Doktor ID"
            defaultValue={String(searchParams?.doctorId ?? "")}
            className="rounded border border-foreground/20 bg-background p-2"
          />
          <select
            name="status"
            defaultValue={String(searchParams?.status ?? "")}
            className="rounded border border-foreground/20 bg-background p-2"
          >
            <option value="">Tüm Durumlar</option>
            <option value="pending">Onay Bekliyor</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="completed">Tamamlandı</option>
          </select>
          <button
            type="submit"
            className="col-span-3 md:col-span-1 bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90"
          >
            Filtrele
          </button>
        </form>
      </section>

      {/* Diğer randevular */}
      {others.length > 0 && (
        <section className="bg-background rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Diğer Randevular
          </h2>
          <table className="min-w-full table-auto">
            <thead className="border-b border-foreground/20">
              <tr className="text-left text-foreground/70">
                <th className="py-2 px-3">Hasta</th>
                <th className="py-2 px-3">Telefon</th>
                <th className="py-2 px-3">İşlem</th>
                <th className="py-2 px-3">Doktor</th>
                <th className="py-2 px-3">Tarih‑Saat</th>
                <th className="py-2 px-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {others.map((a) => (
                <tr key={a.id} className="border-b border-foreground/10">
                  <td className="py-2 px-3">{a.patients.full_name}</td>
                  <td className="py-2 px-3">
                    {formatPhone(a.patients.phone)}
                  </td>
                  <td className="py-2 px-3">{a.procedures.name}</td>
                  <td className="py-2 px-3">{a.doctors.full_name}</td>
                  <td className="py-2 px-3">
                    {formatDateTime(a.starts_at)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={statusLabel(a.status).className}>
                      {statusLabel(a.status).text}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

