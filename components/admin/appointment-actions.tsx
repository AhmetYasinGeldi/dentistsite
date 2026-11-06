"use client";

import type { FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  approveAppointmentAction,
  cancelAppointmentAction,
  rejectAppointmentAction,
} from "@/app/admin/actions";

type AppointmentFilters = {
  date: string;
  doctorId: string;
  status: string;
};

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
  children,
  className,
}: {
  action: AppointmentAction;
  appointmentId: number;
  filters: AppointmentFilters;
  confirmation?: string;
  children: React.ReactNode;
  className?: string;
}) {
  function confirmSubmission(event: FormEvent<HTMLFormElement>) {
    if (confirmation && !window.confirm(confirmation)) {
      event.preventDefault();
    }
  }

  return (
    <form
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
  status: string;
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
