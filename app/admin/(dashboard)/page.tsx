import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/shared/phone";
import {
  formatDateTime,
  istanbulLocalToIso,
  todayInIstanbul,
} from "@/lib/shared/datetime";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  statusLabel,
} from "@/lib/shared/appointment-status";
import {
  approveAppointmentAction,
  cancelAppointmentAction,
  rejectAppointmentAction,
} from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Randevular | Klinik Yönetim Paneli",
};

const filtersSchema = z.object({
  date: z.union([z.literal(""), z.iso.date()]).default(""),
  doctorId: z.union([z.literal(""), z.string().regex(/^[1-9]\d*$/)]).default(""),
  status: z
    .union([
      z.literal(""),
      z
        .enum(APPOINTMENT_STATUSES)
        .refine((status) => status !== "pending"),
    ])
    .default(""),
});

const MAX_STATUS_FILTER_RESULTS = 100;
const appointmentNoticeSchema = z.object({
  notice: z.enum([
    "approved",
    "rejected",
    "cancelled",
    "invalid",
    "update_failed",
    "stale",
  ]),
  notification: z
    .enum(["sent", "failed", "window_closed"])
    .optional(),
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
  const appointmentNotice = appointmentNoticeSchema.safeParse({
    notice: firstValue(params.notice),
    notification: firstValue(params.notification),
  });
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
  } else if (!filters.status) {
    othersQuery = othersQuery.gte(
      "starts_at",
      istanbulLocalToIso(todayInIstanbul(), "00:00"),
    );
  }
  if (filters.doctorId) {
    othersQuery = othersQuery.eq("doctor_id", Number(filters.doctorId));
  }
  if (filters.status) {
    othersQuery = othersQuery.eq("status", filters.status);
  }

  let orderedOthersQuery = othersQuery.order("starts_at", {
    ascending: !filters.status || filters.status === "approved",
  });
  if (filters.status) {
    orderedOthersQuery = orderedOthersQuery.limit(MAX_STATUS_FILTER_RESULTS);
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
    orderedOthersQuery,
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
  const statusFilterLimitReached =
    Boolean(filters.status) &&
    otherAppointments.length === MAX_STATUS_FILTER_RESULTS;

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
              <th className="px-3 py-2">İşlem</th>
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
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {appointment.status === "pending" && (
                        <>
                          <form action={approveAppointmentAction}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />
                            <button
                              type="submit"
                              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                            >
                              Onayla
                            </button>
                          </form>
                          <form
                            action={rejectAppointmentAction}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />
                            <label>
                              <span className="sr-only">
                                İsteğe bağlı red sebebi
                              </span>
                              <input
                                type="text"
                                name="rejectionReason"
                                maxLength={500}
                                placeholder="Red sebebi (isteğe bağlı)"
                                className="w-48 rounded border border-foreground/20 bg-background px-2 py-1.5 text-sm text-foreground"
                              />
                            </label>
                            <button
                              type="submit"
                              className="rounded border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
                            >
                              Reddet
                            </button>
                          </form>
                        </>
                      )}
                      {(appointment.status === "pending" ||
                        appointment.status === "approved") && (
                        <form action={cancelAppointmentAction}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />
                          <button
                            type="submit"
                            className="rounded border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                          >
                            İptal Et
                          </button>
                        </form>
                      )}
                    </div>
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
      {appointmentNotice.success &&
        (() => {
          const { notice, notification } = appointmentNotice.data;

          if (notice === "invalid") {
            return (
              <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">
                İşlem bilgileri geçersiz. Lütfen tekrar deneyin.
              </p>
            );
          }
          if (notice === "update_failed") {
            return (
              <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">
                Randevu güncellenemedi. Lütfen tekrar deneyin.
              </p>
            );
          }
          if (notice === "stale") {
            return (
              <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">
                Randevu durumu değişmiş. Listeyi yenileyip tekrar kontrol edin.
              </p>
            );
          }

          const actionLabel =
            notice === "approved"
              ? "Onaylandı"
              : notice === "rejected"
                ? "Reddedildi"
                : "İptal edildi";

          if (notification === "sent") {
            return (
              <p
                role="status"
                className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-foreground"
              >
                Randevu {actionLabel.toLocaleLowerCase("tr-TR")}; hastaya
                WhatsApp bildirimi gönderildi.
              </p>
            );
          }

          return (
            <p role="alert" className="rounded-lg bg-accent/20 p-4 text-foreground">
              Hastaya WhatsApp bildirimi gönderilemedi.
              {notification === "window_closed" &&
                " Hasta 24 saattir mesaj göndermediği için bildirim iletilemedi."}
            </p>
          );
        })()}

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
              {APPOINTMENT_STATUSES.filter(
                (status) => status !== "pending",
              ).map((status) => (
                <option key={status} value={status}>
                  {APPOINTMENT_STATUS_LABELS[status]}
                </option>
              ))}
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

        {statusFilterLimitReached && (
          <p
            role="status"
            className="rounded border border-accent bg-accent/10 p-3 text-sm text-foreground"
          >
            Bu filtrede en fazla {MAX_STATUS_FILTER_RESULTS} randevu gösteriliyor.
            Daha fazla sonuç olabilir; listeyi daraltmak için tarih veya doktor
            filtresi seçebilirsiniz.
          </p>
        )}

        {renderAppointments(otherAppointments)}
      </section>
    </div>
  );
}
