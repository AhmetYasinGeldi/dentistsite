"use client";

import { useEffect, useState } from "react";
import { AppointmentDialog } from "@/components/admin/appointment-dialog";
import {
  DB_ERROR_MESSAGES,
  type DbErrorCode,
} from "@/lib/shared/errors";

type AppointmentNotice =
  | "approved"
  | "rejected"
  | "cancelled"
  | "rescheduled"
  | "completed"
  | "invalid"
  | "update_failed"
  | "stale"
  | "operation_failed"
  | "reschedule_approval_failed";

type NotificationStatus =
  | "sent"
  | "failed"
  | "window_closed"
  | "past"
  | undefined;

export function AppointmentActionNotice({
  notice,
  notification,
  errorCode,
}: {
  notice: AppointmentNotice;
  notification: NotificationStatus;
  errorCode?: DbErrorCode;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    url.searchParams.delete("notification");
    url.searchParams.delete("error");
    url.searchParams.delete("resultId");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  let message: string;
  let isError = false;

  if (notice === "invalid") {
    message = "İşlem bilgileri geçersiz. Lütfen tekrar deneyin.";
    isError = true;
  } else if (notice === "update_failed") {
    message = "Randevu güncellenemedi. Lütfen tekrar deneyin.";
    isError = true;
  } else if (notice === "stale") {
    message =
      "Randevu durumu değişmiş veya randevu saati geçmiş. Listeyi yenileyip tekrar kontrol edin.";
    isError = true;
  } else if (notice === "operation_failed") {
    message = errorCode
      ? DB_ERROR_MESSAGES[errorCode]
      : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
    isError = true;
  } else if (notice === "reschedule_approval_failed") {
    message =
      "Yeni randevu oluşturuldu ancak onaylanamadı. Lütfen randevu listesinden kontrol edin.";
    isError = true;
  } else if (notice === "completed") {
    message = "Randevu tamamlandı olarak işaretlendi.";
  } else {
    const actionLabel =
      notice === "approved"
        ? "onaylandı"
        : notice === "rejected"
          ? "reddedildi"
          : notice === "rescheduled"
            ? "ertelendi"
            : "iptal edildi";

    if (notification === "sent") {
      message = `Randevu ${actionLabel}; hastaya WhatsApp bildirimi gönderildi.`;
    } else if (notification === "past") {
      message = `Randevu ${actionLabel}. Bildirim gönderilmedi, randevu saati geçmiş.`;
    } else {
      message = `Randevu ${actionLabel}, ancak hastaya WhatsApp bildirimi gönderilemedi.${
        notification === "window_closed"
          ? " Hasta 24 saattir mesaj göndermediği için bildirim iletilemedi."
          : ""
      }`;
      isError = true;
    }
  }

  return (
    <AppointmentDialog
      open={open}
      onClose={() => setOpen(false)}
      title={isError ? "İşlem uyarısı" : "İşlem tamamlandı"}
      closeOnBackdrop={false}
    >
      <p
        role={isError ? "alert" : "status"}
        className={`mt-4 rounded-lg p-4 ${
          isError
            ? "bg-danger/10 text-danger"
            : "bg-primary/10 text-foreground"
        }`}
      >
        {message}
      </p>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          autoFocus
          onClick={() => setOpen(false)}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Tamam
        </button>
      </div>
    </AppointmentDialog>
  );
}
