"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
): string {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.doctorId) params.set("doctorId", filters.doctorId);
  if (filters.status) params.set("status", filters.status);
  params.set("notice", notice);
  if (notification) params.set("notification", notification);

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
  notice: "approved" | "rejected" | "cancelled",
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
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_by: "admin",
    })
    .eq("id", parsedId.data)
    .in("status", ["pending", "approved"])
    .gt("starts_at", now)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Randevu iptal edilirken Supabase hatası:", error);
    redirect(getAdminUrl(filters, "update_failed"));
  }
  if (!data) redirect(getAdminUrl(filters, "stale"));

  await notifyAndRefresh(data.id, "cancelled", filters);
}
