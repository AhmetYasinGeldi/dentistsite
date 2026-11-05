"use client";

import { useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  approveAppointmentAction,
  cancelAppointmentAction,
  rejectAppointmentAction,
  type AppointmentFilters,
} from "@/app/admin/actions";
import type { AppointmentStatus } from "@/lib/shared/appointment-status";

type AppointmentAction = (
  formData: FormData,
) => void | Promise<void>;

function PendingSubmitButton({
  children,
  className,
}: {
  children: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "İşleniyor..." : children}
    </button>
  );
}

function FilterFields({ filters }: { filters: AppointmentFilters }) {
  return (
    <>
      <input type="hidden" name="filterDate" value={filters.date} />
      <input type="hidden" name="filterDoctorId" value={filters.doctorId} />
      <input type="hidden" name="filterStatus" value={filters.status} />
    </>
  );
}

function AppointmentActionForm({
  action,
  appointmentId,
  filters,
  confirmation,
  confirmationAction,
  children,
  className,
}: {
  action: AppointmentAction;
  appointmentId: number;
  filters: AppointmentFilters;
  confirmation: string;
  confirmationAction: string;
  children: React.ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const confirmedRef = useRef(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const titleId = `appointment-confirmation-title-${appointmentId}`;
  const descriptionId = `appointment-confirmation-description-${appointmentId}`;

  function confirmSubmission(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }

    event.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      triggerRef.current = document.activeElement;
    }
    setIsConfirmationOpen(true);
  }

  function cancelSubmission() {
    setIsConfirmationOpen(false);
    triggerRef.current?.focus();
  }

  function confirmSubmissionAfterReview() {
    confirmedRef.current = true;
    setIsConfirmationOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={confirmSubmission}
      className={className}
    >
      <input
        type="hidden"
        name="appointmentId"
        value={appointmentId}
      />
      <FilterFields filters={filters} />
      {children}
      {isConfirmationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) cancelSubmission();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancelSubmission();
            if (event.key === "Tab" && event.shiftKey &&
                document.activeElement === cancelButtonRef.current) {
              event.preventDefault();
              confirmButtonRef.current?.focus();
            } else if (event.key === "Tab" && !event.shiftKey &&
                document.activeElement === confirmButtonRef.current) {
              event.preventDefault();
              cancelButtonRef.current?.focus();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md rounded-xl border border-foreground/10 bg-background p-6 text-foreground shadow-xl"
          >
            <h2
              id={titleId}
              className="text-lg font-semibold"
            >
              İşlemi Onaylayın
            </h2>
            <p
              id={descriptionId}
              className="mt-3 text-sm text-foreground/70"
            >
              {confirmation}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                autoFocus
                onClick={cancelSubmission}
                className="rounded border border-foreground/20 px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Vazgeç
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={confirmSubmissionAfterReview}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                {confirmationAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export function AppointmentActions({
  appointmentId,
  isFuture,
  status,
  filters,
}: {
  appointmentId: number;
  isFuture: boolean;
  status: AppointmentStatus;
  filters: AppointmentFilters;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "pending" && isFuture && (
        <AppointmentActionForm
          action={approveAppointmentAction}
          appointmentId={appointmentId}
          filters={filters}
          confirmation="Randevuyu onaylamak istediğinize emin misiniz?"
          confirmationAction="Onayla"
        >
          <PendingSubmitButton
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Onayla
          </PendingSubmitButton>
        </AppointmentActionForm>
      )}
      {status === "pending" && (
        <AppointmentActionForm
          action={rejectAppointmentAction}
          appointmentId={appointmentId}
          filters={filters}
          confirmation="Randevuyu reddetmek istediğinize emin misiniz?"
          confirmationAction="Reddet"
          className="flex flex-wrap items-center gap-2"
        >
          <label>
            <span className="sr-only">İsteğe bağlı red sebebi</span>
            <input
              type="text"
              name="rejectionReason"
              maxLength={500}
              placeholder="Red sebebi (isteğe bağlı)"
              className="w-48 rounded border border-foreground/20 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <PendingSubmitButton
            className="rounded border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
          >
            Reddet
          </PendingSubmitButton>
        </AppointmentActionForm>
      )}
      {status === "approved" && isFuture && (
        <AppointmentActionForm
          action={cancelAppointmentAction}
          appointmentId={appointmentId}
          filters={filters}
          confirmation="Randevuyu iptal etmek istediğinize emin misiniz?"
          confirmationAction="İptal Et"
        >
          <PendingSubmitButton
            className="rounded border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            İptal Et
          </PendingSubmitButton>
        </AppointmentActionForm>
      )}
    </div>
  );
}
