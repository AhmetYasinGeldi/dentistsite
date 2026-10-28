import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Tanıtım sitesi için oturumsuz anon istemci. RLS gereği sadece aktif
// doktor/işlem ve klinik bilgilerini okuyabilir.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
