import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

const LOGIN_PATH = "/admin/login";

// Admin paneli koruması: oturumu yeniler, giriş yoksa /admin/login'e yönlendirir.
// Sadece /admin altında çalışır; site (/) ve webhook bu dosyadan geçmez.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // createServerClient ile bu satır arasına kod ekleme; oturum yenilemesi burada olur.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isLoginPage =
    pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);

  if (!isLoggedIn && !isLoginPage) {
    const redirect = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    // Yenilenen/silinen oturum çerezleri yönlendirme yanıtında da taşınmalı.
    response.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
