import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
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
  isAppointmentStatus,
  statusLabel,
} from "@/lib/shared/appointment-status";
import { AppointmentActionNotice } from "@/components/admin/appointment-action-notice";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { AppointmentDetails } from "@/components/admin/appointment-details";

export const metadata: Metadata = {
  title: "Randevular | Klinik Yönetim Paneli",
};

export const instant = false;

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
const APPOINTMENT_LIST_SELECT = `
  id,
  starts_at,
  ends_at,
  status,
  patient_note,
  admin_note,
  rescheduled_from,
  patients!inner(full_name, phone),
  procedures!inner(name),
  doctors!inner(full_name)
`;
const appointmentNoticeSchema = z.object({
  notice: z.enum([
    "approved",
    "rejected",
    "cancelled",
    "rescheduled",
    "completed",
    "invalid",
    "update_failed",
    "stale",
    "operation_failed",
    "reschedule_approval_failed",
  ]),
  notification: z
    .enum(["sent", "failed", "window_closed", "past"])
    .optional(),
  error: z.enum(["RD002", "RD003", "RD004", "23P01"]).optional(),
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

function appointmentIsFuture(startsAt: string): boolean {
  return Date.parse(startsAt) > Date.now();
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
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
    .select(APPOINTMENT_LIST_SELECT)
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
      .select(APPOINTMENT_LIST_SELECT)
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
  const previousAppointmentIds = [
    ...new Set(
      [...pendingAppointments, ...otherAppointments]
        .map((appointment) => appointment.rescheduled_from)
        .filter((id): id is number => id !== null),
    ),
  ];
  const previousAppointmentsById = new Map<
    number,
    { starts_at: string; status: string }
  >();

  if (previousAppointmentIds.length > 0) {
    const previousAppointmentsResult = await supabase
      .from("appointments")
      .select("id, starts_at, status")
      .in("id", previousAppointmentIds);

    if (previousAppointmentsResult.error) {
      console.error(
        "Önceki randevu bilgileri alınırken Supabase hatası:",
        previousAppointmentsResult.error,
      );
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

    for (const appointment of previousAppointmentsResult.data) {
      previousAppointmentsById.set(appointment.id, appointment);
    }
  }

  const statusFilterLimitReached =
    Boolean(filters.status) &&
    otherAppointments.length === MAX_STATUS_FILTER_RESULTS;
  const today = todayInIstanbul();

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
              <th className="px-3 py-2">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((appointment) => {
              const status = statusLabel(appointment.status);
              const appointmentStatus = isAppointmentStatus(appointment.status)
                ? appointment.status
                : null;
              const isActive =
                appointment.status === "pending" ||
                appointment.status === "approved";
              const canReschedule =
                isActive && Date.parse(appointment.ends_at) > Date.now();
              const canComplete =
                appointment.status === "approved" &&
                Date.parse(appointment.ends_at) <= Date.now();
              const previousAppointment =
                appointment.rescheduled_from === null
                  ? undefined
                  : previousAppointmentsById.get(appointment.rescheduled_from);

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
                    <div className="flex flex-wrap items-center gap-2">
                      {appointmentStatus && (
                        <>
                          <AppointmentDetails
                            appointment={{
                              id: appointment.id,
                              startsAt: appointment.starts_at,
                              endsAt: appointment.ends_at,
                              status: appointmentStatus,
                              patientName: appointment.patients.full_name,
                              patientPhone: appointment.patients.phone,
                              patientNote: appointment.patient_note,
                              adminNote: appointment.admin_note,
                              procedureName: appointment.procedures.name,
                              doctorName: appointment.doctors.full_name,
                              previousAppointment: previousAppointment
                                ? {
                                    startsAt: previousAppointment.starts_at,
                                    status: previousAppointment.status,
                                  }
                                : null,
                              today,
                              isActive,
                              canReschedule,
                              canComplete,
                            }}
                            filters={filters}
                          />
                          <AppointmentActions
                            appointmentId={appointment.id}
                            isFuture={appointmentIsFuture(appointment.starts_at)}
                            status={appointmentStatus}
                            filters={filters}
                          />
                        </>
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
      {appointmentNotice.success && (
        <AppointmentActionNotice
          notice={appointmentNotice.data.notice}
          notification={appointmentNotice.data.notification}
          errorCode={appointmentNotice.data.error}
        />
      )}

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

      <section
        id="other-appointments"
        className="space-y-4 rounded-lg bg-background p-4 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-foreground">
          Diğer Randevular
        </h2>
        <form
          action="/admin#appointment-results"
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

        <div id="appointment-results" className="scroll-mt-6">
          {renderAppointments(otherAppointments)}
        </div>
      </section>
    </div>
  );
}
