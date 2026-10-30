"use client";

import { LogoutButton } from "./logout-button";

interface HeaderProps {
  clinicName?: string;
  userEmail?: string;
  onOpenMenu?: () => void;
}

export function Header({
  clinicName = "Diş Kliniği",
  userEmail = "Yönetici",
  onOpenMenu,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-foreground/10 bg-background/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Sol: Mobil Menü Butonu & Klinik Başlığı */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-foreground/60 hover:bg-muted hover:text-foreground focus:outline-none"
          aria-label="Menüyü aç"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            {clinicName}
          </span>
        </div>
      </div>

      {/* Sağ: Kullanıcı Profili ve Çıkış Butonu */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-foreground/70 bg-muted border border-foreground/10 rounded-lg px-2.5 py-1.5">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span className="font-medium truncate max-w-[180px]">{userEmail}</span>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}

