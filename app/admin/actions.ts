"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getErrorCode,
  getErrorMessage,
  isDbErrorCode,
  type DbErrorCode,
} from "@/lib/shared/errors";
import { APPOINTMENT_STATUSES } from "@/lib/shared/appointment-status";
import { createClient } from "@/lib/supabase/server";
import { notifyAppointmentUpdate } from "@/lib/whatsapp/notify";

const loginSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifre gereklidir."),
});

export type LoginActionState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _prevState: LoginActionState | null,
  formData: FormData,
): Promise<LoginActionState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      error: "Lütfen bilgilerinizi kontrol edin.",
    };
  }

  const { email, password } = parsed.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.code === "invalid_credentials") {
        return {
          error: "E-posta adresi veya şifre hatalı.",
        };
      }

      console.error("Giriş işlemi sırasında Supabase hatası:", error);
      return {
        error: "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
      };
    }
  } catch (err) {
    console.error("Giriş işlemi sırasında sunucu hatası:", err);
    return {
      error: "Sunucuyla iletişim kurulurken bir sorun oluştu.",
    };
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Çıkış yapılırken Supabase hatası:", error);
    }
  } catch (err) {
    console.error("Çıkış yapılırken hata:", err);
  }

  redirect("/admin/login");
}

const appointmentIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

const rejectionReasonSchema = z.string().trim().max(500).nullable();
const adminNoteSchema = z.string().trim().max(2000);
const rescheduleDateSchema = z.iso.date();
const newStartsAtSchema = z.iso.datetime({ offset: true });

const appointmentFiltersSchema = z.object({
  date: z.union([z.literal(""), z.iso.date()]).default(""),
  doctorId: z
    .union([z.literal(""), z.string().regex(/^[1-9]\d*$/)])
    .default(""),
  status: z
    .union([
      z.literal(""),
      z
        .enum(APPOINTMENT_STATUSES)
        .refine((status) => status !== "pending"),
    ])
    .default(""),
});

export type AppointmentFilters = z.infer<typeof appointmentFiltersSchema>;

function getAppointmentFilters(formData: FormData): AppointmentFilters {
  const parsed = appointmentFiltersSchema.safeParse({
    date: formData.get("filterDate"),
    doctorId: formData.get("filterDoctorId"),
    status: formData.get("filterStatus"),
  });

  return parsed.success ? parsed.data : appointmentFiltersSchema.parse({});
}

function getAdminUrl(
  filters: AppointmentFilters,
  notice: string,
  notification?: "sent" | "failed" | "window_closed" | "past",
  errorCode?: DbErrorCode,
): string {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.doctorId) params.set("doctorId", filters.doctorId);
  if (filters.status) params.set("status", filters.status);
  params.set("notice", notice);
  if (notification) params.set("notification", notification);
  if (errorCode) params.set("error", errorCode);

  return `/admin?${params.toString()}`;
}

async function requireAdminClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Randevu işlemi sırasında oturum kontrolü hatası:", error);
    redirect("/admin/login");
  }
  if (!data.user) redirect("/admin/login");

  return supabase;
}

async function notifyAndRefresh(
  appointmentId: number,
  notice: "approved" | "rejected" | "cancelled" | "rescheduled",
  filters: AppointmentFilters,
  skipNotification?: "past",
): Promise<void> {
  let notification: "sent" | "failed" | "window_closed" | "past" =
    skipNotification ?? "failed";

  if (!skipNotification) {
    try {
      const result = await notifyAppointmentUpdate(appointmentId);
      if (result.sent) {
        notification = "sent";
      } else if (result.reason === "WINDOW_CLOSED") {
        notification = "window_closed";
      }
    } catch (error) {
      console.error("Randevu sonrası WhatsApp bildirimi gönderilemedi:", error);
    }
  }

  revalidatePath("/admin");
  redirect(getAdminUrl(filters, notice, notification));
}

export async function approveAppointmentAction(
  formData: FormData,
): Promise<void> {
  const filters = getAppointmentFilters(formData);
  const parsedId = appointmentIdSchema.safeParse(
    formData.get("appointmentId"),
  );
  if (!parsedId.success) redirect(getAdminUrl(filters, "invalid"));

  const supabase = await requireAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "approved",
      decided_at: new Date().toISOString(),
      rejection_reason: null,
      cancelled_by: null,
    })
    .eq("id", parsedId.data)
    .eq("status", "pending")
    .gt("starts_at", now)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Randevu onaylanırken Supabase hatası:", error);
    redirect(getAdminUrl(filters, "update_failed"));
  }
  if (!data) redirect(getAdminUrl(filters, "stale"));

  await notifyAndRefresh(data.id, "approved", filters);
}

export async function rejectAppointmentAction(
  formData: FormData,
): Promise<void> {
  const filters = getAppointmentFilters(formData);
  const parsed = z
    .object({
      appointmentId: appointmentIdSchema,
      rejectionReason: rejectionReasonSchema,
    })
    .safeParse({
      appointmentId: formData.get("appointmentId"),
      rejectionReason: formData.get("rejectionReason"),
    });

  if (!parsed.success) redirect(getAdminUrl(filters, "invalid"));

  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      rejection_reason: parsed.data.rejectionReason || null,
      cancelled_by: null,
    })
    .eq("id", parsed.data.appointmentId)
    .eq("status", "pending")
    .select("id, starts_at")
    .maybeSingle();

  if (error) {
    console.error("Randevu reddedilirken Supabase hatası:", error);
    redirect(getAdminUrl(filters, "update_failed"));
  }
  if (!data) redirect(getAdminUrl(filters, "stale"));

  const appointmentHasPassed = Date.parse(data.starts_at) <= Date.now();
  await notifyAndRefresh(
    data.id,
    "rejected",
    filters,
    appointmentHasPassed ? "past" : undefined,
  );
}

export async function cancelAppointmentAction(
  formData: FormData,
): Promise<void> {
  const filters = getAppointmentFilters(formData);
  const parsedId = appointmentIdSchema.safeParse(
    formData.get("appointmentId"),
  );
  if (!parsedId.success) redirect(getAdminUrl(filters, "invalid"));
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_by: "admin",
    })
    .eq("id", parsedId.data)
    .in("status", ["pending", "approved"])
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Randevu iptal edilirken Supabase hatası:", error);
    redirect(getAdminUrl(filters, "update_failed"));
  }
  if (!data) redirect(getAdminUrl(filters, "stale"));

  await notifyAndRefresh(data.id, "cancelled", filters);
}

export async function completeAppointmentAction(
  formData: FormData,
): Promise<void> {
  const filters = getAppointmentFilters(formData);
  const parsedId = appointmentIdSchema.safeParse(
    formData.get("appointmentId"),
  );
  if (!parsedId.success) redirect(getAdminUrl(filters, "invalid"));

  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", parsedId.data)
    .eq("status", "approved")
    .lte("ends_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Randevu tamamlandı olarak işaretlenirken hata:", error);
    redirect(getAdminUrl(filters, "update_failed"));
  }
  if (!data) redirect(getAdminUrl(filters, "stale"));

  revalidatePath("/admin");
  redirect(getAdminUrl(filters, "completed"));
}

export type AdminNoteActionState = {
  success: boolean;
  message: string;
};

export async function updateAdminNoteAction(
  _previousState: AdminNoteActionState,
  formData: FormData,
): Promise<AdminNoteActionState> {
  const parsed = z
    .object({
      appointmentId: appointmentIdSchema,
      adminNote: adminNoteSchema,
    })
    .safeParse({
      appointmentId: formData.get("appointmentId"),
      adminNote: formData.get("adminNote"),
    });

  if (!parsed.success) {
    return {
      success: false,
      message: "Not bilgisi geçersiz. En fazla 2000 karakter yazabilirsiniz.",
    };
  }

  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ admin_note: parsed.data.adminNote || null })
    .eq("id", parsed.data.appointmentId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Admin randevu notu kaydedilirken hata:", error);
    return { success: false, message: getErrorMessage(error) };
  }
  if (!data) {
    return { success: false, message: "Randevu bulunamadı." };
  }

  revalidatePath("/admin");
  return { success: true, message: "Klinik notu kaydedildi." };
}

type AvailableSlot = {
  slot_start: string;
  slot_end: string;
};

export async function getAvailableSlotsAction(
  appointmentId: number,
  date: string,
): Promise<{ slots?: AvailableSlot[]; error?: string }> {
  const parsed = z
    .object({
      appointmentId: z.number().int().positive().safe(),
      date: rescheduleDateSchema,
    })
    .safeParse({ appointmentId, date });
  if (!parsed.success) {
    return { error: "Lütfen geçerli bir tarih seçin." };
  }

  const supabase = await requireAdminClient();
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("doctor_id, procedure_id, status, ends_at")
    .eq("id", parsed.data.appointmentId)
    .maybeSingle();

  if (appointmentError) {
    console.error("Erteleme öncesi randevu okunamadı:", appointmentError);
    return { error: getErrorMessage(appointmentError) };
  }
  if (!appointment) return { error: "Randevu bulunamadı." };
  if (
    !["pending", "approved"].includes(appointment.status) ||
    Date.parse(appointment.ends_at) <= Date.now()
  ) {
    return { error: "Bu randevu artık aktif değil." };
  }

  const { data: slots, error } = await supabase.rpc("get_available_slots", {
    p_doctor_id: appointment.doctor_id,
    p_procedure_id: appointment.procedure_id,
    p_date: parsed.data.date,
  });

  if (error) {
    console.error("Müsait saatler alınırken Supabase hatası:", error);
    return { error: getErrorMessage(error) };
  }

  return { slots };
}

export async function rescheduleAppointmentAction(
  formData: FormData,
): Promise<void> {
  const filters = getAppointmentFilters(formData);
  const parsed = z
    .object({
      appointmentId: appointmentIdSchema,
      newStartsAt: newStartsAtSchema,
    })
    .safeParse({
      appointmentId: formData.get("appointmentId"),
      newStartsAt: formData.get("newStartsAt"),
    });

  if (!parsed.success) redirect(getAdminUrl(filters, "invalid"));

  const supabase = await requireAdminClient();
  const { data: newAppointmentId, error } = await supabase.rpc(
    "reschedule_appointment",
    {
      p_appointment_id: parsed.data.appointmentId,
      p_new_starts_at: parsed.data.newStartsAt,
      p_cancelled_by: "admin",
    },
  );

  if (error) {
    console.error("Randevu ertelenirken Supabase hatası:", error);
    const code = getErrorCode(error);
    redirect(
      getAdminUrl(
        filters,
        "operation_failed",
        undefined,
        isDbErrorCode(code) ? code : undefined,
      ),
    );
  }
  if (!newAppointmentId) {
    redirect(getAdminUrl(filters, "operation_failed"));
  }

  const { data: approvedAppointment, error: approvalError } = await supabase
    .from("appointments")
    .update({ status: "approved", decided_at: new Date().toISOString() })
    .eq("id", newAppointmentId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (approvalError) {
    console.error("Ertelenen randevu onaylanırken Supabase hatası:", approvalError);
    redirect(getAdminUrl(filters, "reschedule_approval_failed"));
  }
  if (!approvedAppointment) {
    redirect(getAdminUrl(filters, "reschedule_approval_failed"));
  }

  await notifyAndRefresh(approvedAppointment.id, "rescheduled", filters);
}
