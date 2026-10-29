import type { Metadata } from "next";
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary text-primary shadow-sm mb-4">
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Diş / Klinik Simgesi */}
              <path d="M12 2C8 2 6 4.5 6 8c0 4 2 8 3.5 12 .5 1.5 2 2 2.5 2s2-.5 2.5-2C16 16 18 12 18 8c0-3.5-2-6-6-6z" />
              <path d="M9.5 9c.5-1.5 1.5-2.5 2.5-2.5s2 1 2.5 2.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Klinik Yönetim Paneli
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Randevuları ve takvimi yönetmek için giriş yapın
          </p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
