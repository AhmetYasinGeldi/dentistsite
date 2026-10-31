"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  exact?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Randevular",
    href: "/admin",
    exact: true,
    icon: (active) => (
      <svg
        className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary-foreground" : "text-foreground/50"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    name: "Takvim",
    href: "/admin/takvim",
    icon: (active) => (
      <svg
        className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary-foreground" : "text-foreground/50"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    name: "Ayarlar",
    href: "/admin/ayarlar",
    icon: (active) => (
      <svg
        className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary-foreground" : "text-foreground/50"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

interface SidebarProps {
  clinicName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ clinicName = "Diş Kliniği", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Mobil menü açıkken Escape tuşuyla kapatma desteği
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isLinkActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-background border-r border-foreground/10">
      {/* Üst Logo ve Panel Başlığı */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-foreground/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-primary font-bold shadow-xs">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8 2 6 4.5 6 8c0 4 2 8 3.5 12 .5 1.5 2 2 2.5 2s2-.5 2.5-2C16 16 18 12 18 8c0-3.5-2-6-6-6z" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-foreground truncate">
            {clinicName}
          </span>
          <span className="text-xs text-foreground/60">Yönetim Paneli</span>
        </div>
      </div>

      {/* Menü Bağlantıları */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isLinkActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.icon(active)}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      {/* Masaüstü Sabit Yan Menü */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {navContent}
      </aside>

      {/* Mobil Açılır Menü (Drawer) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Karartma arka planı */}
          <div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Menü çekmecesi */}
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] z-50">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
