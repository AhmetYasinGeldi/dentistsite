"use client";

import { useEffect, useId, useRef } from "react";

export function AppointmentDialog({
  open,
  onClose,
  title,
  description,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const titleId = `appointment-dialog-title-${id}`;
  const descriptionId = `appointment-dialog-description-${id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          dialogRef.current?.close();
        }
      }}
      className="m-auto max-h-[min(90vh,48rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-foreground/10 bg-background p-6 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      {description && (
        <p
          id={descriptionId}
          className="mt-2 text-sm text-foreground/70"
        >
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}
