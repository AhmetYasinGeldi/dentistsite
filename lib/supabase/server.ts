import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

// Admin panelinin sunucu bileşenleri ve server action'ları için oturumlu istemci.
// Her istekte yeniden oluşturulur; modül seviyesinde paylaşılmaz.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Sunucu bileşeninden çağrıldığında çerez yazılamaz; oturum
            // yenilemesini proxy.ts yaptığı için bu durum göz ardı edilebilir.
          }
        },
      },
    },
  );
}
