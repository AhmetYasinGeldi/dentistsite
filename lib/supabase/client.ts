import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Admin panelinin "use client" bileşenleri için tarayıcı istemcisi (anon key + oturum çerezi).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
