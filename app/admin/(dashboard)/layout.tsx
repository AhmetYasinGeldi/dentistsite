import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PanelShell } from "@/components/admin/panel-shell";

export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Oturum kontrolü (proxy.ts kontrolüne ek olarak sunucu tarafı güvencesi)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Klinik adını veritabanından oku
  const { data: settings } = await supabase
    .from("clinic_settings")
    .select("clinic_name")
    .eq("id", 1)
    .maybeSingle();

  const clinicName = settings?.clinic_name || "Diş Kliniği";

  return (
    <PanelShell clinicName={clinicName} userEmail={user.email}>
      {children}
    </PanelShell>
  );
}
