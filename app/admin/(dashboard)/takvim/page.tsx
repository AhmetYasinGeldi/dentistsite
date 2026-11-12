import type { Metadata } from "next";
import { connection } from "next/server";
import { z } from "zod";
import type { AppointmentDetailData } from "@/components/admin/appointment-details";
import { CalendarGrid } from "@/components/admin/calendar-grid";
import { createClient } from "@/lib/supabase/server";
import {
  formatDate,
  istanbulLocalToIso,
  todayInIstanbul,
} from "@/lib/shared/datetime";
import {
  isAppointmentStatus,
} from "@/lib/shared/appointment-status";

export const metadata: Metadata = {
  title: "Takvim | Klinik Yönetim Paneli",
};

export const instant = false;

const calendarParamsSchema = z.object({
  date: z.iso.date().optional(),
  view: z.enum(["day", "week"]).default("week"),
});

const APPOINTMENT_SELECT = `
  id,
  doctor_id,
  starts_at,
  ends_at,
  status,
  patient_note,
  admin_note,
  rescheduled_from,
  patients!inner(full_name, phone),
  procedures!inner(name),
  doctors!inner(id, full_name)
`;

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function startOfWeek(date: string): string {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
}

function isoDateTime(date: string, time: string): string {
  return istanbulLocalToIso(date, time.slice(0, 5));
}

function isFuture(value: string): boolean {
  return Date.parse(value) > Date.now();
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const params = await searchParams;
  const parsedParams = calendarParamsSchema.safeParse({
    date: firstValue(params.date),
    view: firstValue(params.view) ?? "week",
  });

  if (!parsedParams.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Takvim
        </h1>
        <p role="alert" className="rounded-brand bg-danger/10 p-4 text-danger">
          Takvim bilgileri geçersiz. Lütfen tarihi ve görünümü yeniden seçin.
        </p>
      </div>
    );
  }

  const selectedDate = parsedParams.data.date ?? todayInIstanbul();
  const view = parsedParams.data.view;
  const rangeStart = view === "week" ? startOfWeek(selectedDate) : selectedDate;
  const dayCount = view === "week" ? 7 : 1;
  const rangeEnd = addDays(rangeStart, dayCount);
  const days = Array.from({ length: dayCount }, (_, index) =>
    addDays(rangeStart, index),
  );
  const dayOfWeek = (date: string) => {
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    return weekday === 0 ? 7 : weekday;
  };
  const selectedWeekdays = new Set(days.map(dayOfWeek));
  const supabase = await createClient();

  const [doctorsResult, appointmentsResult, hoursResult] = await Promise.all([
    supabase.from("doctors").select("id, full_name").order("full_name"),
    supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .gte("starts_at", isoDateTime(rangeStart, "00:00"))
      .lt("starts_at", isoDateTime(rangeEnd, "00:00"))
      .order("starts_at", { ascending: true }),
    supabase
      .from("working_hours")
      .select("day_of_week, is_open, open_time, close_time")
      .order("day_of_week"),
  ]);

  const queryError =
    doctorsResult.error ?? appointmentsResult.error ?? hoursResult.error;
  if (queryError) {
    console.error("Takvim verileri alınırken Supabase hatası:", queryError);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Takvim
        </h1>
        <p role="alert" className="rounded-brand bg-danger/10 p-4 text-danger">
          Takvim verileri alınamadı. Lütfen daha sonra tekrar deneyin.
        </p>
      </div>
    );
  }

  const appointmentRows = appointmentsResult.data ?? [];
  const invalidAppointment = appointmentRows.find(
    (appointment) => !isAppointmentStatus(appointment.status),
  );
  if (invalidAppointment) {
    console.error("Takvimde bilinmeyen randevu durumu:", {
      appointmentId: invalidAppointment.id,
      status: invalidAppointment.status,
    });
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Takvim
        </h1>
        <p role="alert" className="rounded-brand bg-danger/10 p-4 text-danger">
          Randevu durum bilgileri okunamadı. Lütfen daha sonra tekrar deneyin.
        </p>
      </div>
    );
  }

  const previousAppointmentIds = [
    ...new Set(
      appointmentRows
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
            Takvim
          </h1>
          <p role="alert" className="rounded-brand bg-danger/10 p-4 text-danger">
            Takvim verileri alınamadı. Lütfen daha sonra tekrar deneyin.
          </p>
        </div>
      );
    }

    for (const appointment of previousAppointmentsResult.data) {
      previousAppointmentsById.set(appointment.id, appointment);
    }
  }

  const today = todayInIstanbul();
  const appointments: AppointmentDetailData[] = appointmentRows.map(
    (appointment) => {
      if (!isAppointmentStatus(appointment.status)) {
        throw new Error("Takvim randevusunun durumu doğrulanamadı.");
      }
      const previousAppointment =
        appointment.rescheduled_from === null
          ? null
          : previousAppointmentsById.get(appointment.rescheduled_from);
      const active =
        appointment.status === "pending" || appointment.status === "approved";

      return {
        id: appointment.id,
        doctorId: appointment.doctor_id,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        status: appointment.status,
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
        isActive: active,
        canReschedule: active && isFuture(appointment.ends_at),
        canComplete:
          appointment.status === "approved" && !isFuture(appointment.ends_at),
      };
    },
  );

  const openHours = (hoursResult.data ?? []).filter((hours) => hours.is_open);
  const visibleOpenHours = openHours.filter((hours) =>
    selectedWeekdays.has(hours.day_of_week),
  );
  const startTimes = visibleOpenHours
    .map((hours) => hours.open_time)
    .filter((time): time is string => time !== null);
  const endTimes = visibleOpenHours
    .map((hours) => hours.close_time)
    .filter((time): time is string => time !== null);
  const appointmentStartTimes = appointments.map((appointment) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(appointment.startsAt)),
  );
  const appointmentEndTimes = appointments.map((appointment) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(appointment.endsAt)),
  );
  const timeToMinutes = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  };
  const allStartTimes = [...startTimes, ...appointmentStartTimes];
  const allEndTimes = [...endTimes, ...appointmentEndTimes];
  const earliest = allStartTimes.length
    ? Math.min(...allStartTimes.map(timeToMinutes))
    : 8 * 60;
  const latest = allEndTimes.length
    ? Math.max(...allEndTimes.map(timeToMinutes))
    : 18 * 60;
  const visibleStartMinutes = Math.max(0, Math.floor(earliest / 60) * 60);
  const visibleEndMinutes = Math.min(
    24 * 60,
    Math.ceil(latest / 60) * 60 || 24 * 60,
  );

  const previousDate = addDays(rangeStart, -dayCount);
  const nextDate = addDays(rangeStart, dayCount);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Takvim
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Doktor bazlı günlük ve haftalık randevu ajandası
        </p>
      </div>

      <form
        action="/admin/takvim"
        method="GET"
        className="flex flex-wrap items-end gap-3"
      >
        <label className="grid gap-1 text-sm text-muted-foreground">
          Görünüm
          <select
            name="view"
            defaultValue={view}
            className="min-h-11 rounded-brand border border-border bg-background px-3 text-foreground"
          >
            <option value="day">Günlük</option>
            <option value="week">Haftalık</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-muted-foreground">
          Tarih
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="min-h-11 rounded-brand border border-border bg-background px-3 text-foreground"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-brand bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        >
          Göster
        </button>
        <a
          href={`/admin/takvim?view=${view}&date=${previousDate}`}
          className="inline-flex min-h-11 items-center rounded-brand border border-border px-4 text-foreground hover:bg-muted"
        >
          Önceki
        </a>
        <a
          href={`/admin/takvim?view=${view}&date=${nextDate}`}
          className="inline-flex min-h-11 items-center rounded-brand border border-border px-4 text-foreground hover:bg-muted"
        >
          Sonraki
        </a>
        <a
          href={`/admin/takvim?view=${view}&date=${today}`}
          className="inline-flex min-h-11 items-center rounded-brand border border-border px-4 text-foreground hover:bg-muted"
        >
          Bugün
        </a>
      </form>

      <h2 className="text-sm font-semibold capitalize text-foreground">
        {view === "day"
          ? formatDate(`${days[0]}T12:00:00+03:00`)
          : `${formatDate(`${days[0]}T12:00:00+03:00`)} – ${formatDate(
              `${days[days.length - 1]}T12:00:00+03:00`,
            )}`}
      </h2>

      <CalendarGrid
        days={days}
        doctors={(doctorsResult.data ?? []).map((doctor) => ({
          id: doctor.id,
          name: doctor.full_name,
        }))}
        appointments={appointments}
        visibleStartMinutes={visibleStartMinutes}
        visibleEndMinutes={visibleEndMinutes}
      />
    </div>
  );
}
