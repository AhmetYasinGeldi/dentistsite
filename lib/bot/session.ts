import "server-only";

import { z } from "zod";
import type { Json } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStep, type Step } from "@/lib/bot/steps";

// wa_sessions.context içinde tutulan taslak seçimler. Hepsi isteğe bağlı;
// akış ilerledikçe doldurulur, randevu oluşunca veya "menü"de sıfırlanır.
export const sessionContextSchema = z
  .object({
    procedureId: z.number().int(),
    doctorId: z.number().int(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // İstanbul tarihi
    timePeriod: z.enum(["morning", "afternoon"]),
    slotStart: z.string(), // timestamptz, ör. 2026-11-05T10:30:00+03:00
    page: z.number().int().min(0), // liste sayfası ("Diğer ..." satırı)
    appointmentId: z.number().int(), // iptal/erteleme yapılan randevu
  })
  .partial();

export type SessionContext = z.infer<typeof sessionContextSchema>;

export type Session = {
  step: Step;
  context: SessionContext;
  patientId: number | null;
};

const EMPTY_SESSION: Session = { step: "idle", context: {}, patientId: null };

/**
 * Gelen her mesajda çağrılır: numaranın oturumu yoksa "idle" adımıyla oluşturur,
 * varsa sadece last_inbound_at'i günceller (adım ve taslak korunur).
 */
export async function touchSession(phone: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("wa_sessions")
    .upsert({ phone, last_inbound_at: new Date().toISOString() }, { onConflict: "phone" });
  if (error) console.error("[bot/session] Oturum güncellenemedi:", error);
}

/** Oturumu okur. Kayıt yoksa veya veri bozuksa güvenli varsayılana döner. */
export async function getSession(phone: string): Promise<Session> {
  const { data, error } = await createAdminClient()
    .from("wa_sessions")
    .select("step, context, patient_id")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("[bot/session] Oturum okunamadı:", error);
    return EMPTY_SESSION;
  }
  if (!data) return EMPTY_SESSION;

  if (!isStep(data.step)) {
    console.error("[bot/session] Bilinmeyen adım, idle'a dönülüyor:", data.step);
    return { ...EMPTY_SESSION, patientId: data.patient_id };
  }

  const context = sessionContextSchema.safeParse(data.context);
  if (!context.success) {
    console.error("[bot/session] Bozuk taslak, sıfırlanıyor:", context.error.issues);
  }

  return {
    step: data.step,
    context: context.success ? context.data : {},
    patientId: data.patient_id,
  };
}

/** Adımı ve taslağı birlikte kaydeder (taslak tamamen yenisiyle değişir). */
export async function setSession(
  phone: string,
  step: Step,
  context: SessionContext = {},
): Promise<void> {
  const { error } = await createAdminClient()
    .from("wa_sessions")
    .update({ step, context: context as Json })
    .eq("phone", phone);
  if (error) console.error("[bot/session] Oturum kaydedilemedi:", error);
}

/** "menü" yazıldığında veya bir iş bittiğinde oturumu başa alır. */
export async function resetSession(phone: string): Promise<void> {
  await setSession(phone, "idle", {});
}
