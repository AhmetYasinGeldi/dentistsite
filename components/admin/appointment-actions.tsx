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
import { AppointmentDialog } from "@/components/admin/appointment-dialog";

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

export function AppointmentActionForm({
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
  const confirmedRef = useRef(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

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
      <AppointmentDialog
        open={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false);
          requestAnimationFrame(() => triggerRef.current?.focus());
        }}
        title="İşlemi Onaylayın"
        description={confirmation}
      >
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => {
              setIsConfirmationOpen(false);
              requestAnimationFrame(() => triggerRef.current?.focus());
            }}
            className="rounded border border-foreground/20 px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={confirmSubmissionAfterReview}
            className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            {confirmationAction}
          </button>
        </div>
      </AppointmentDialog>
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
      {(status === "approved" || status === "pending") && (
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
