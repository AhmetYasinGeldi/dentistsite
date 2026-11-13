"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  cancelAppointmentAction,
  completeAppointmentAction,
  getAvailableSlotsAction,
  rescheduleAppointmentAction,
  updateAdminNoteAction,
  type AdminNoteActionState,
  type AppointmentFilters,
  type AppointmentReturnContext,
} from "@/app/admin/actions";
import {
  AppointmentActionForm,
} from "@/components/admin/appointment-actions";
import { AppointmentDialog } from "@/components/admin/appointment-dialog";
import { formatDateTime } from "@/lib/shared/datetime";
import { formatPhone } from "@/lib/shared/phone";
import { DB_ERROR_MESSAGES, type DbErrorCode } from "@/lib/shared/errors";
import {
  getAppointmentStatusLabel,
  type AppointmentStatus,
} from "@/lib/shared/appointment-status";

type PreviousAppointment = {
  startsAt: string;
  status: string;
};

export type AppointmentDetailData = {
  id: number;
  doctorId: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  patientName: string;
  patientPhone: string;
  patientNote: string | null;
  adminNote: string | null;
  procedureName: string;
  doctorName: string;
  previousAppointment: PreviousAppointment | null;
  today: string;
  isActive: boolean;
  canReschedule: boolean;
  canComplete: boolean;
};

const initialNoteState: AdminNoteActionState = {
  success: false,
  message: "",
};

function AppointmentDetailsContent({
  appointment,
  filters,
  returnContext,
  onClose,
  initialRescheduleDate,
  initialRescheduleError,
}: {
  appointment: AppointmentDetailData;
  filters: AppointmentFilters;
  returnContext: AppointmentReturnContext;
  onClose: () => void;
  initialRescheduleDate?: string;
  initialRescheduleError?: DbErrorCode;
}) {
  const [noteState, saveNoteAction, isSavingNote] = useActionState(
    updateAdminNoteAction,
    initialNoteState,
  );
  const [selectedDate, setSelectedDate] = useState(
    initialRescheduleDate ?? appointment.today,
  );
  const [slots, setSlots] = useState<
    { slot_start: string; slot_end: string }[]
  >([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotError, setSlotError] = useState("");
  const [rescheduleErrorOpen, setRescheduleErrorOpen] = useState(
    Boolean(initialRescheduleError),
  );
  const [isLoadingSlots, startLoadingSlots] = useTransition();

  useEffect(() => {
    if (!initialRescheduleError) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    url.searchParams.delete("notification");
    url.searchParams.delete("error");
    url.searchParams.delete("resultId");
    url.searchParams.delete("rescheduleAppointmentId");
    url.searchParams.delete("rescheduleDate");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [initialRescheduleError]);

  function loadSlots(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSlots([]);
    setSelectedSlot("");
    setSlotError("");

    startLoadingSlots(async () => {
      const result = await getAvailableSlotsAction(appointment.id, selectedDate);
      if (result.error) {
        setSlotError(result.error);
        return;
      }

      setSlots(result.slots ?? []);
      if (!result.slots?.length) {
        setSlotError("Seçilen gün için uygun saat bulunamadı.");
      }
    });
  }

  return (
    <>
      <AppointmentDialog
          open
          onClose={onClose}
          title="Randevu Detayı"
          description={`${appointment.patientName} · ${formatDateTime(appointment.startsAt)}`}
        >
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-foreground/60">Hasta</dt>
            <dd className="font-medium">{appointment.patientName}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/60">Telefon</dt>
            <dd className="font-medium">{formatPhone(appointment.patientPhone)}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/60">İşlem</dt>
            <dd className="font-medium">{appointment.procedureName}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/60">Doktor</dt>
            <dd className="font-medium">{appointment.doctorName}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/60">Tarih-Saat</dt>
            <dd className="font-medium">{formatDateTime(appointment.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/60">Durum</dt>
            <dd className="font-medium">
              {getAppointmentStatusLabel(appointment.status)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-foreground/60">Hasta Notu</dt>
            <dd className="whitespace-pre-wrap">
              {appointment.patientNote || "Not eklenmemiş."}
            </dd>
          </div>
          {appointment.previousAppointment && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-foreground/60">Önceki Randevu</dt>
              <dd className="font-medium">
                {formatDateTime(appointment.previousAppointment.startsAt)} ·{" "}
                {getAppointmentStatusLabel(
                  appointment.previousAppointment.status,
                )}
              </dd>
            </div>
          )}
        </dl>

        <section className="mt-6 border-t border-foreground/10 pt-5">
          <h3 className="font-semibold">Klinik Notu</h3>
          <form action={saveNoteAction} className="mt-3 space-y-3">
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <textarea
              name="adminNote"
              defaultValue={appointment.adminNote ?? ""}
              maxLength={2000}
              rows={3}
              aria-label="Klinik notu"
              placeholder="Bu randevu için klinik notu yazın"
              className="w-full rounded border border-foreground/20 bg-background p-3 text-sm text-foreground"
            />
            {noteState.message && (
              <p
                role={noteState.success ? "status" : "alert"}
                className={
                  noteState.success
                    ? "text-sm text-success"
                    : "text-sm text-danger"
                }
              >
                {noteState.message}
              </p>
            )}
            <button
              type="submit"
              disabled={isSavingNote}
              className="rounded border border-foreground/20 px-3 py-2 text-sm hover:bg-muted"
            >
              {isSavingNote ? "Kaydediliyor..." : "Notu Kaydet"}
            </button>
          </form>
        </section>

        {appointment.isActive && (
          <section className="mt-6 border-t border-foreground/10 pt-5">
            <h3 className="font-semibold">Randevu İşlemleri</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <AppointmentActionForm
                action={cancelAppointmentAction}
                appointmentId={appointment.id}
                filters={filters}
                returnContext={returnContext}
                confirmation="Randevuyu iptal etmek istediğinize emin misiniz?"
                confirmationAction="İptal Et"
              >
                <button
                  type="submit"
                  className="rounded border border-danger/40 px-3 py-2 text-sm text-danger hover:bg-danger/10"
                >
                  İptal Et
                </button>
              </AppointmentActionForm>
            </div>

            {appointment.canReschedule && (
              <>
                <form onSubmit={loadSlots} className="mt-5 space-y-3">
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`reschedule-date-${appointment.id}`}
                  >
                    Erteleme tarihi
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      id={`reschedule-date-${appointment.id}`}
                      type="date"
                      required
                      min={appointment.today}
                      value={selectedDate}
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        setSlots([]);
                        setSelectedSlot("");
                        setSlotError("");
                      }}
                      className="rounded border border-foreground/20 bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingSlots}
                      className="rounded border border-foreground/20 px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
                    >
                      {isLoadingSlots
                        ? "Saatler alınıyor..."
                        : "Müsait Saatleri Getir"}
                    </button>
                  </div>
                </form>

                {slotError && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    {slotError}
                  </p>
                )}
                {slots.length > 0 && (
                  <AppointmentActionForm
                    action={rescheduleAppointmentAction}
                    appointmentId={appointment.id}
                    filters={filters}
                    returnContext={returnContext}
                    confirmation="Randevuyu seçilen yeni saate ertelemek istediğinize emin misiniz?"
                    confirmationAction="Ertele"
                    className="mt-4 flex flex-wrap items-end gap-2"
                  >
                    <input
                      type="hidden"
                      name="rescheduleDate"
                      value={selectedDate}
                    />
                    <label className="grid gap-1 text-sm font-medium">
                      Yeni saat
                      <select
                        name="newStartsAt"
                        required
                        value={selectedSlot}
                        onChange={(event) => setSelectedSlot(event.target.value)}
                        className="rounded border border-foreground/20 bg-background px-3 py-2 text-sm font-normal"
                      >
                        <option value="">Saat seçin</option>
                        {slots.map((slot) => (
                          <option key={slot.slot_start} value={slot.slot_start}>
                            {formatDateTime(slot.slot_start)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={!selectedSlot}
                      className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      Ertele
                    </button>
                  </AppointmentActionForm>
                )}
              </>
            )}
          </section>
        )}

        {appointment.canComplete && (
          <section className="mt-6 border-t border-foreground/10 pt-5">
            <AppointmentActionForm
              action={completeAppointmentAction}
              appointmentId={appointment.id}
              filters={filters}
              returnContext={returnContext}
              confirmation="Randevuyu tamamlandı olarak işaretlemek istediğinize emin misiniz?"
              confirmationAction="Tamamlandı"
            >
              <button
                type="submit"
                className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Tamamlandı olarak işaretle
              </button>
            </AppointmentActionForm>
          </section>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-foreground/20 px-4 py-2 text-sm hover:bg-muted"
          >
            Kapat
          </button>
        </div>
      </AppointmentDialog>
      {initialRescheduleError && (
        <AppointmentDialog
          open={rescheduleErrorOpen}
          onClose={() => setRescheduleErrorOpen(false)}
          title="Erteleme yapılamadı"
          closeOnBackdrop={false}
        >
          <p role="alert" className="mt-4 rounded-brand bg-danger/10 p-4 text-danger">
            {DB_ERROR_MESSAGES[initialRescheduleError]}
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              autoFocus
              onClick={() => setRescheduleErrorOpen(false)}
              className="min-h-11 rounded-brand bg-primary px-4 text-primary-foreground hover:bg-primary/90"
            >
              Tamam
            </button>
          </div>
        </AppointmentDialog>
      )}
    </>
  );
}

export function AppointmentDetails({
  appointment,
  filters,
  returnContext = { returnTo: "/admin" },
  initiallyOpen = false,
  initialRescheduleDate,
  initialRescheduleError,
  triggerContent,
  triggerClassName,
  triggerStyle,
}: {
  appointment: AppointmentDetailData;
  filters: AppointmentFilters;
  returnContext?: AppointmentReturnContext;
  initiallyOpen?: boolean;
  initialRescheduleDate?: string;
  initialRescheduleError?: DbErrorCode;
  triggerContent?: React.ReactNode;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ??
          "rounded border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
        }
        style={triggerStyle}
      >
        {triggerContent ?? "Detay"}
      </button>
      {isOpen && (
        <AppointmentDetailsContent
          appointment={appointment}
          filters={filters}
          returnContext={returnContext}
          initialRescheduleDate={initialRescheduleDate}
          initialRescheduleError={initialRescheduleError}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
