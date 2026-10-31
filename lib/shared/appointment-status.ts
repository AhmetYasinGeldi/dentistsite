import type { Database } from "@/lib/database.types";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

// Şemada status bir enum değil, CHECK kısıtlı text olduğu için üretilen tip
// sadece `string`. Geçerli değerler burada tek yerde tanımlanır ve satır
// tipine atanabilir olmaları derleme anında kontrol edilir.
export const APPOINTMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
] as const satisfies readonly AppointmentRow["status"][];

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Saati kilitleyen (aktif) durumlar. */
export const ACTIVE_APPOINTMENT_STATUSES = [
  "pending",
  "approved",
] as const satisfies readonly AppointmentStatus[];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Onay bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  cancelled: "İptal edildi",
  completed: "Tamamlandı",
};

// Panelde durum rozeti için Tailwind sınıfları (renkler app/globals.css @theme'de).
export const APPOINTMENT_STATUS_CLASSES: Record<AppointmentStatus, string> = {
  pending: "bg-accent/20 text-foreground border-accent",
  approved: "bg-success/15 text-success border-success",
  rejected: "bg-danger/15 text-danger border-danger",
  cancelled: "bg-muted text-foreground/70 border-foreground/20",
  completed: "bg-secondary text-primary border-primary/30",
};

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

/** Bilinmeyen bir değer gelirse değerin kendisini gösterir. */
export function getAppointmentStatusLabel(status: string): string {
  return isAppointmentStatus(status)
    ? APPOINTMENT_STATUS_LABELS[status]
    : status;
}

export function getAppointmentStatusClasses(status: string): string {
  return isAppointmentStatus(status)
    ? APPOINTMENT_STATUS_CLASSES[status]
    : APPOINTMENT_STATUS_CLASSES.cancelled;
}

/**
 * Durum etiketi ve ilgili Tailwind sınıflarını bir arada döndürür.
 * Kullanım: `const { text, className } = statusLabel(status);`
 */
export function statusLabel(status: string) {
  return {
    text: getAppointmentStatusLabel(status),
    className: getAppointmentStatusClasses(status),
  };
}


