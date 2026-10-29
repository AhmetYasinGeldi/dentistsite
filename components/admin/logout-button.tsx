"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/admin/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      title="Oturumu Kapat"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger/20 disabled:opacity-50 transition"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span>{isPending ? "Çıkış..." : "Çıkış Yap"}</span>
    </button>
  );
}

