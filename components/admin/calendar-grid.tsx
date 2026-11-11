"use client";

import { AppointmentDetails } from "@/components/admin/appointment-details";
import type { AppointmentDetailData } from "@/components/admin/appointment-details";
import {
  getAppointmentStatusClasses,
  getAppointmentStatusLabel,
} from "@/lib/shared/appointment-status";
import { formatDate, formatTime } from "@/lib/shared/datetime";

type CalendarDoctor = {
  id: number;
  name: string;
};

type CalendarEvent = {
  appointment: AppointmentDetailData;
  startMinute: number;
  layoutEndMinute: number;
  lane: number;
};

const ROW_HEIGHT_PX = 24;
const MIN_EVENT_MINUTES = 45;
const MIN_EVENT_ROWS = MIN_EVENT_MINUTES / 15;

function getCalendarStatusClasses(status: string): string {
  if (status === "cancelled") {
    return "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/40";
  }
  return getAppointmentStatusClasses(status);
}

function localDate(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function localMinute(value: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return hour * 60 + minute;
}

function weekdayLabel(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

function timeLabel(minutes: number): string {
  return formatTime(
    `2026-01-01T${String(Math.floor(minutes / 60)).padStart(2, "0")}:00:00+03:00`,
  );
}

function getEventsByDoctor(
  date: string,
  doctor: CalendarDoctor,
  appointments: AppointmentDetailData[],
): { events: CalendarEvent[]; laneCount: number } {
  const matches = appointments
    .filter(
      (appointment) =>
        appointment.doctorId === doctor.id &&
        localDate(appointment.startsAt) === date,
    )
    .sort(
      (left, right) =>
        Date.parse(left.startsAt) - Date.parse(right.startsAt),
    );
  const laneEnds: number[] = [];
  const events = matches.map((appointment) => {
    const startMinute = localMinute(appointment.startsAt);
    const actualDuration = Math.ceil(
      (Date.parse(appointment.endsAt) - Date.parse(appointment.startsAt)) /
        60_000,
    );
    const layoutEndMinute =
      startMinute + Math.max(MIN_EVENT_MINUTES, actualDuration);
    let lane = laneEnds.findIndex((end) => end <= startMinute);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = layoutEndMinute;
    return { appointment, startMinute, layoutEndMinute, lane };
  });
  return { events, laneCount: Math.max(1, laneEnds.length) };
}

function DayCalendar({
  date,
  doctors,
  appointments,
  visibleStartMinutes,
  visibleEndMinutes,
}: {
  date: string;
  doctors: CalendarDoctor[];
  appointments: AppointmentDetailData[];
  visibleStartMinutes: number;
  visibleEndMinutes: number;
}) {
  const slotCount = Math.max(
    4,
    Math.ceil((visibleEndMinutes - visibleStartMinutes) / 15),
  );
  const gridTemplateColumns = `4rem repeat(${doctors.length}, minmax(12rem, 1fr))`;
  const columnEvents = doctors.map((doctor) =>
    getEventsByDoctor(date, doctor, appointments),
  );
  const gridStyle = {
    gridTemplateColumns,
    width: "100%",
    minWidth: `${4 + doctors.length * 12}rem`,
  };

  return (
    <section
      aria-label={`${weekdayLabel(date)}, ${formatDate(`${date}T12:00:00+03:00`)}`}
      className="overflow-x-auto rounded-brand border border-border bg-background"
    >
      <h3 className="border-b border-border bg-muted px-4 py-3 text-sm font-semibold capitalize text-foreground">
        {weekdayLabel(date)}, {formatDate(`${date}T12:00:00+03:00`)}
      </h3>

      <div className="min-w-full">
        <div className="grid border-b-2 border-border bg-muted" style={gridStyle}>
          <div className="border-r-2 border-border px-2 py-3 text-xs font-medium text-muted-foreground">
            Saat
          </div>
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="border-r-2 border-border px-3 py-3 text-sm font-semibold text-foreground last:border-r-0"
            >
              {doctor.name}
            </div>
          ))}
        </div>

        <div
          className="grid"
          style={{
            ...gridStyle,
            gridTemplateRows: `repeat(${slotCount}, ${ROW_HEIGHT_PX}px)`,
          }}
        >
          <div
            className="grid border-r-2 border-border"
            style={{
              gridRow: "1 / -1",
              gridTemplateRows: `repeat(${slotCount}, ${ROW_HEIGHT_PX}px)`,
            }}
          >
            {Array.from({ length: Math.ceil(slotCount / 4) }, (_, hourIndex) => (
              <span
                key={hourIndex}
                className="border-t border-border px-1 pt-1 text-xs tabular-nums text-muted-foreground"
                style={{ gridRow: `${hourIndex * 4 + 1} / span 4` }}
              >
                {timeLabel(visibleStartMinutes + hourIndex * 60)}
              </span>
            ))}
          </div>

          {doctors.map((doctor, index) => {
            const { events, laneCount } = columnEvents[index];
            return (
              <div
                key={doctor.id}
                className="grid border-r-2 border-border last:border-r-0"
                style={{
                  gridRow: "1 / -1",
                  gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${slotCount}, ${ROW_HEIGHT_PX}px)`,
                }}
              >
                {Array.from({ length: slotCount }, (_, slotIndex) => (
                  <div
                    key={slotIndex}
                    className={
                      slotIndex % 4 === 0 ? "border-t border-border" : ""
                    }
                    style={{
                      gridRow: slotIndex + 1,
                      gridColumn: "1 / -1",
                    }}
                  />
                ))}
                {events.map((event) => {
                  const startSlot = Math.max(
                    0,
                    Math.floor((event.startMinute - visibleStartMinutes) / 15),
                  );
                  const endSlot = Math.min(
                    slotCount,
                    Math.max(
                      startSlot + MIN_EVENT_ROWS,
                      Math.ceil(
                        (event.layoutEndMinute - visibleStartMinutes) / 15,
                      ),
                    ),
                  );
                  const statusClasses = getCalendarStatusClasses(
                    event.appointment.status,
                  );
                  const triggerContent = (
                    <>
                      <span className="block truncate font-semibold">
                        {formatTime(event.appointment.startsAt)} ·{" "}
                        {event.appointment.patientName}
                      </span>
                      <span className="block truncate">
                        {event.appointment.procedureName}
                      </span>
                      <span className="block truncate">
                        {getAppointmentStatusLabel(event.appointment.status)}
                      </span>
                    </>
                  );

                  return (
                    <AppointmentDetails
                      key={event.appointment.id}
                      appointment={event.appointment}
                      filters={{ date: "", doctorId: "", status: "" }}
                      triggerContent={triggerContent}
                      triggerClassName={`z-10 m-1 min-h-0 overflow-hidden rounded-brand border px-2 py-1 text-left text-xs leading-4 ${statusClasses}`}
                      triggerStyle={{
                        gridRow: `${startSlot + 1} / span ${Math.max(
                          1,
                          endSlot - startSlot,
                        )}`,
                        gridColumn: event.lane + 1,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WeekCalendar({
  days,
  doctors,
  appointments,
}: {
  days: string[];
  doctors: CalendarDoctor[];
  appointments: AppointmentDetailData[];
}) {
  const gridTemplateColumns = `5rem repeat(${doctors.length}, minmax(0, 1fr))`;
  const gridStyle = {
    gridTemplateColumns,
    minWidth: `${5 + doctors.length * 8}rem`,
  };

  return (
    <div className="overflow-x-auto rounded-brand border border-border bg-background">
      <div className="grid" style={gridStyle}>
        <div className="border-b-2 border-r-2 border-border bg-muted p-2 text-xs font-medium text-muted-foreground">
          Gün
        </div>
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="border-b-2 border-r-2 border-border bg-muted px-2 py-2 text-center text-xs font-semibold text-foreground last:border-r-0 sm:text-sm"
          >
            <span className="block truncate">{doctor.name}</span>
          </div>
        ))}

        {days.map((date) => (
          <div key={date} className="contents">
            <div className="flex flex-col justify-center border-b border-r-2 border-border bg-muted/50 px-2 py-1 text-[10px] capitalize leading-tight text-muted-foreground sm:text-xs">
              <span className="font-semibold text-foreground">
                {weekdayLabel(date)}
              </span>
              <span>{formatDate(`${date}T12:00:00+03:00`)}</span>
            </div>
            {doctors.map((doctor) => {
              const { events } = getEventsByDoctor(date, doctor, appointments);
              return (
                <div
                  key={`${date}-${doctor.id}`}
                  className="min-h-16 overflow-y-auto border-b border-r-2 border-border p-1 last:border-r-0 sm:min-h-[4.5rem]"
                  aria-label={`${doctor.name}, ${weekdayLabel(date)}`}
                >
                  <div className="flex flex-col gap-1">
                    {events.map((event) => (
                      <AppointmentDetails
                        key={event.appointment.id}
                        appointment={event.appointment}
                        filters={{ date: "", doctorId: "", status: "" }}
                        triggerContent={
                          <>
                            <span className="block truncate font-semibold">
                              {formatTime(event.appointment.startsAt)}{" "}
                              {event.appointment.patientName}
                            </span>
                            <span className="block truncate">
                              {event.appointment.procedureName}
                            </span>
                          </>
                        }
                        triggerClassName={`w-full min-w-0 rounded border px-1 py-0.5 text-left text-[10px] leading-3 sm:text-xs sm:leading-4 ${getCalendarStatusClasses(
                          event.appointment.status,
                        )}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarGrid({
  days,
  doctors,
  appointments,
  visibleStartMinutes,
  visibleEndMinutes,
}: {
  days: string[];
  doctors: CalendarDoctor[];
  appointments: AppointmentDetailData[];
  visibleStartMinutes: number;
  visibleEndMinutes: number;
}) {
  if (doctors.length === 0) {
    return (
      <p className="rounded-brand border border-border bg-background p-6 text-sm text-muted-foreground">
        Takvimde gösterilecek doktor bulunamadı.
      </p>
    );
  }

  if (days.length > 1) {
    return (
      <WeekCalendar
        days={days}
        doctors={doctors}
        appointments={appointments}
      />
    );
  }

  return (
    <DayCalendar
      date={days[0]}
      doctors={doctors}
      appointments={appointments}
      visibleStartMinutes={visibleStartMinutes}
      visibleEndMinutes={visibleEndMinutes}
    />
  );
}
