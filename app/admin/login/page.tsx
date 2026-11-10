import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Yönetici Girişi | Diş Kliniği Admin",
  description: "Randevu yönetim paneli yetkili personel girişi.",
};

export default async function AdminLoginPage() {
  // Zaten giriş yapmışsa doğrudan panele yönlendir
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo/zb-dentist-logo-renkli.svg"
            alt="ZB Dentist — Ağız ve Diş Sağlığı"
            width={190}
            height={53}
            loading="eager"
            className="mx-auto mb-6 h-auto w-[190px]"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Klinik Yönetim Paneli
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Randevuları ve takvimi yönetmek için giriş yapın
          </p>
        </div>

        <div className="rounded-brand border border-border bg-background p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
