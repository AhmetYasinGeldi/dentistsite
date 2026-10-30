"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

