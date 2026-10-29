"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-posta adresi gereklidir.")
    .email("Geçerli bir e-posta adresi girin."),
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
      fieldErrors: parsed.error.flatten().fieldErrors,
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
      // Hatalı kimlik bilgisi veya kullanıcı bulunamadığında Türkçe mesaj
      if (
        error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("invalid_grant") ||
        error.status === 400
      ) {
        return {
          error: "E-posta adresi veya şifre hatalı.",
        };
      }

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
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Çıkış yapılırken hata:", err);
  }

  redirect("/admin/login");
}

