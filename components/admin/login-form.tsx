"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginActionState } from "@/app/admin/actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-start gap-3"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          E-posta Adresi
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="admin@klinik.com"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
        {state?.fieldErrors?.email?.[0] && (
          <p className="mt-1 text-xs text-danger">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Şifre
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-foreground shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            disabled={isPending}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? (
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
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {state?.fieldErrors?.password?.[0] && (
          <p className="mt-1 text-xs text-danger">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition"
      >
        {isPending ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Giriş yapılıyor...</span>
          </>
        ) : (
          <span>Giriş Yap</span>
        )}
      </button>

      <div className="pt-2 text-center text-xs text-slate-500">
        Bu panel yalnızca yetkili klinik personeline açıktır.
      </div>
    </form>
  );
}

