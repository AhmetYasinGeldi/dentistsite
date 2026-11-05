"use client";

import { useEffect } from "react";

type AppointmentNotice =
  | "approved"
  | "rejected"
  | "cancelled"
  | "invalid"
  | "update_failed"
  | "stale";

type NotificationStatus = "sent" | "failed" | "window_closed" | undefined;

export function AppointmentActionNotice({
  notice,
  notification,
}: {
  notice: AppointmentNotice;
  notification: NotificationStatus;
}) {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    url.searchParams.delete("notification");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

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
        Randevu durumu değişmiş veya randevu saati geçmiş. Listeyi yenileyip
        tekrar kontrol edin.
      </p>
    );
  }

  const actionLabel =
    notice === "approved"
      ? "onaylandı"
      : notice === "rejected"
        ? "reddedildi"
        : "iptal edildi";

  if (notification === "sent") {
    return (
      <p
        role="status"
        className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-foreground"
      >
        Randevu {actionLabel}; hastaya WhatsApp bildirimi gönderildi.
      </p>
    );
  }

  return (
    <p role="alert" className="rounded-lg bg-accent/20 p-4 text-foreground">
      Randevu {actionLabel}, ancak hastaya WhatsApp bildirimi gönderilemedi.
      {notification === "window_closed" &&
        " Hasta 24 saattir mesaj göndermediği için bildirim iletilemedi."}
    </p>
  );
}
