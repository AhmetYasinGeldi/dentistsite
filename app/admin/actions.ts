"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
): Promise<void> {
  let notification: "sent" | "failed" | "window_closed" = "failed";

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

  revalidatePath("/admin");
  redirect(`/admin?notice=${notice}&notification=${notification}`);
}

export async function approveAppointmentAction(
  formData: FormData,
): Promise<void> {
  const parsedId = appointmentIdSchema.safeParse(
    formData.get("appointmentId"),
  );
  if (!parsedId.success) redirect("/admin?notice=invalid");

  const supabase = await requireAdminClient();
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
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Randevu onaylanırken Supabase hatası:", error);
    redirect("/admin?notice=update_failed");
  }
  if (!data) redirect("/admin?notice=stale");

  await notifyAndRefresh(data.id, "approved");
}

export async function rejectAppointmentAction(
  formData: FormData,
): Promise<void> {
  const parsed = z
    .object({
      appointmentId: appointmentIdSchema,
      rejectionReason: rejectionReasonSchema,
    })
    .safeParse({
      appointmentId: formData.get("appointmentId"),
      rejectionReason: formData.get("rejectionReason"),
    });

  if (!parsed.success) redirect("/admin?notice=invalid");

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
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Randevu reddedilirken Supabase hatası:", error);
    redirect("/admin?notice=update_failed");
  }
  if (!data) redirect("/admin?notice=stale");

  await notifyAndRefresh(data.id, "rejected");
}

export async function cancelAppointmentAction(
  formData: FormData,
): Promise<void> {
  const parsedId = appointmentIdSchema.safeParse(
    formData.get("appointmentId"),
  );
  if (!parsedId.success) redirect("/admin?notice=invalid");

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
    redirect("/admin?notice=update_failed");
  }
  if (!data) redirect("/admin?notice=stale");

  await notifyAndRefresh(data.id, "cancelled");
}
