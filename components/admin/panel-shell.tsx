"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface PanelShellProps {
  clinicName: string;
  userEmail?: string;
  children: React.ReactNode;
}

export function PanelShell({
  clinicName,
  userEmail,
  children,
}: PanelShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      {/* Yan Menü (Sidebar) */}
      <Sidebar
        clinicName={clinicName}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Ana Gövde (Masaüstünde sol menü genişliği kadar içeride) */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Üst Bar (Header) */}
        <Header
          clinicName={clinicName}
          userEmail={userEmail}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />

        {/* Sayfa İçeriği */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

