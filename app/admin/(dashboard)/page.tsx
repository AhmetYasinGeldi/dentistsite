import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/shared/phone";
import { formatDateTime, istanbulLocalToIso } from "@/lib/shared/datetime";
import { statusLabel } from "@/lib/shared/appointment-status";

export const metadata: Metadata = {
  title: "Randevular | Klinik Yönetim Paneli",
};

const appointmentStatuses = [
  "approved",
  "rejected",
  "cancelled",
  "completed",
] as const;

const filtersSchema = z.object({
  date: z.union([z.literal(""), z.iso.date()]).default(""),
  doctorId: z.union([z.literal(""), z.string().regex(/^[1-9]\d*$/)]).default(""),
  status: z.enum(["", ...appointmentStatuses]).default(""),
});

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parsedFilters = filtersSchema.safeParse({
    date: firstValue(params.date) ?? "",
    doctorId: firstValue(params.doctorId) ?? "",
    status: firstValue(params.status) ?? "",
  });

  if (!parsedFilters.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Randevular
        </h1>
        <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">
          Filtre bilgileri geçersiz. Lütfen filtreleri yeniden seçin.
        </p>
        <Link href="/admin" className="text-primary underline">
          Filtreleri temizle
        </Link>
      </div>
    );
  }

  const filters = parsedFilters.data;
  const supabase = await createClient();

  let othersQuery = supabase
    .from("appointments")
    .select(
      `
        id,
        starts_at,
        status,
        patients!inner(full_name, phone),
        procedures!inner(name),
        doctors!inner(full_name)
      `,
    )
    .neq("status", "pending");

  if (filters.date) {
    othersQuery = othersQuery
      .gte("starts_at", istanbulLocalToIso(filters.date, "00:00"))
      .lt("starts_at", istanbulLocalToIso(nextDate(filters.date), "00:00"));
  }
  if (filters.doctorId) {
    othersQuery = othersQuery.eq("doctor_id", Number(filters.doctorId));
  }
  if (filters.status) {
    othersQuery = othersQuery.eq("status", filters.status);
  }

  const [pendingResult, othersResult, doctorsResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `
          id,
          starts_at,
          status,
          patients!inner(full_name, phone),
          procedures!inner(name),
          doctors!inner(full_name)
        `,
      )
      .eq("status", "pending")
      .order("starts_at", { ascending: true }),
    othersQuery.order("starts_at", { ascending: true }),
    supabase.from("doctors").select("id, full_name").order("full_name"),
  ]);

  const queryError =
    pendingResult.error ?? othersResult.error ?? doctorsResult.error;
  if (queryError) {
    console.error("Randevu listesi alınırken Supabase hatası:", queryError);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Randevular
        </h1>
        <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">
          Randevu listesi alınamadı. Lütfen daha sonra tekrar deneyin.
        </p>
      </div>
    );
  }

  const pendingAppointments = pendingResult.data ?? [];
  const otherAppointments = othersResult.data ?? [];
  const doctors = doctorsResult.data ?? [];

  const renderAppointments = (rows: typeof pendingAppointments) =>
    rows.length === 0 ? (
      <p className="p-4 text-sm text-foreground/60">
        Filtrelere uygun randevu bulunamadı.
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="border-b border-foreground/20">
            <tr className="text-left text-foreground/70">
              <th className="px-3 py-2">Hasta</th>
              <th className="px-3 py-2">Telefon</th>
              <th className="px-3 py-2">İşlem</th>
              <th className="px-3 py-2">Doktor</th>
              <th className="px-3 py-2">Tarih-Saat</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((appointment) => {
              const status = statusLabel(appointment.status);

              return (
                <tr
                  key={appointment.id}
                  className="border-b border-foreground/10"
                >
                  <td className="px-3 py-2">
                    {appointment.patients.full_name}
                  </td>
                  <td className="px-3 py-2">
                    {formatPhone(appointment.patients.phone)}
                  </td>
                  <td className="px-3 py-2">
                    {appointment.procedures.name}
                  </td>
                  <td className="px-3 py-2">
                    {appointment.doctors.full_name}
                  </td>
                  <td className="px-3 py-2">
                    {formatDateTime(appointment.starts_at)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={status.className}>{status.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="border-b border-foreground/10 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Randevular
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Bekleyen talepler ve diğer randevular
        </p>
      </div>

      <section
        aria-labelledby="pending-appointments-heading"
        className="rounded-lg border border-accent bg-accent/10 p-4"
      >
        <h2
          id="pending-appointments-heading"
          className="mb-4 text-lg font-semibold text-foreground"
        >
          Onay Bekleyen Randevular
        </h2>
        {pendingAppointments.length === 0 ? (
          <p className="p-4 text-sm text-foreground/60">
            Onay bekleyen randevu bulunmuyor.
          </p>
        ) : (
          renderAppointments(pendingAppointments)
        )}
      </section>

      <section className="space-y-4 rounded-lg bg-background p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Diğer Randevular
        </h2>
        <form
          action="/admin"
          method="GET"
          className="grid grid-cols-1 gap-4 md:grid-cols-4"
        >
          <label className="space-y-1 text-sm text-foreground/70">
            <span>Tarih</span>
            <input
              type="date"
              name="date"
              defaultValue={filters.date}
              className="w-full rounded border border-foreground/20 bg-background p-2 text-foreground"
            />
          </label>
          <label className="space-y-1 text-sm text-foreground/70">
            <span>Doktor</span>
            <select
              name="doctorId"
              defaultValue={filters.doctorId}
              className="w-full rounded border border-foreground/20 bg-background p-2 text-foreground"
            >
              <option value="">Tüm Doktorlar</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-foreground/70">
            <span>Durum</span>
            <select
              name="status"
              defaultValue={filters.status}
              className="w-full rounded border border-foreground/20 bg-background p-2 text-foreground"
            >
              <option value="">Tüm Durumlar</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
              <option value="cancelled">İptal Edildi</option>
              <option value="completed">Tamamlandı</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Filtrele
            </button>
            <Link
              href="/admin"
              className="rounded border border-foreground/20 px-4 py-2 text-foreground hover:bg-muted"
            >
              Temizle
            </Link>
          </div>
        </form>

        {renderAppointments(otherAppointments)}
      </section>
    </div>
  );
}
