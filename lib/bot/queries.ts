import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Sohbet akışının veritabanı okuma/yazmaları. Hata fırlatmaz: okuma hatasında
// boş sonuç döner ve hatayı sunucu log'una yazar; yazma işlemleri hatayı döndürür.

export type Procedure = { id: number; name: string; durationMinutes: number };
export type Doctor = { id: number; title: string; fullName: string; specialty: string };
export type ActiveAppointment = {
  id: number;
  startsAt: string;
  status: string;
  doctor: string;
  procedure: string;
};

function logError(what: string, error: unknown) {
  console.error(`[bot/queries] ${what}:`, error);
}

export async function getPatientByPhone(phone: string) {
  const { data, error } = await createAdminClient()
    .from("patients")
    .select("id, full_name")
    .eq("phone", phone)
    .maybeSingle();
  if (error) logError("Hasta okunamadı", error);
  return data;
}

/** Yeni hasta oluşturur; aynı telefon aynı anda eklendiyse (23505) mevcut kaydı döndürür. */
export async function createPatient(phone: string, fullName: string) {
  const { data, error } = await createAdminClient()
    .from("patients")
    .insert({ phone, full_name: fullName })
    .select("id, full_name")
    .single();
  if (!error) return data;
  if (error.code === "23505") return getPatientByPhone(phone);
  logError("Hasta oluşturulamadı", error);
  return null;
}

/** Hastanın aktif (pending/approved, bitmemiş) randevusu. */
export async function getActiveAppointment(patientId: number): Promise<ActiveAppointment | null> {
  const { data, error } = await createAdminClient()
    .from("appointments")
    .select("id, starts_at, status, doctors(title, full_name), procedures(name)")
    .eq("patient_id", patientId)
    .in("status", ["pending", "approved"])
    .gt("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(1)
    .maybeSingle();
  if (error) logError("Aktif randevu okunamadı", error);
  if (!data) return null;
  return {
    id: data.id,
    startsAt: data.starts_at,
    status: data.status,
    doctor: data.doctors ? `${data.doctors.title} ${data.doctors.full_name}` : "",
    procedure: data.procedures?.name ?? "",
  };
}

/** Aktif ve en az bir aktif doktorun yaptığı işlemler (sıralı). */
export async function getBookableProcedures(): Promise<Procedure[]> {
  const { data, error } = await createAdminClient()
    .from("procedures")
    .select("id, name, duration_minutes, doctor_procedures(doctors(is_active))")
    .eq("is_active", true)
    .order("sort_order");
  if (error) logError("İşlemler okunamadı", error);
  return (data ?? [])
    .filter((p) => p.doctor_procedures.some((dp) => dp.doctors?.is_active))
    .map((p) => ({ id: p.id, name: p.name, durationMinutes: p.duration_minutes }));
}

export async function getProcedure(id: number): Promise<Procedure | null> {
  const { data, error } = await createAdminClient()
    .from("procedures")
    .select("id, name, duration_minutes")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) logError("İşlem okunamadı", error);
  return data ? { id: data.id, name: data.name, durationMinutes: data.duration_minutes } : null;
}

/** İşlemi yapan aktif doktorlar (sıralı). */
export async function getDoctorsForProcedure(procedureId: number): Promise<Doctor[]> {
  const { data, error } = await createAdminClient()
    .from("doctor_procedures")
    .select("doctors(id, title, full_name, specialty, is_active, sort_order)")
    .eq("procedure_id", procedureId);
  if (error) logError("Doktorlar okunamadı", error);
  return (data ?? [])
    .flatMap((row) => (row.doctors?.is_active ? [row.doctors] : []))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => ({ id: d.id, title: d.title, fullName: d.full_name, specialty: d.specialty }));
}

export async function getDoctor(id: number): Promise<Doctor | null> {
  const { data, error } = await createAdminClient()
    .from("doctors")
    .select("id, title, full_name, specialty")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) logError("Doktor okunamadı", error);
  return data
    ? { id: data.id, title: data.title, fullName: data.full_name, specialty: data.specialty }
    : null;
}

/** Rezervasyon aralığı (gün) ve klinik telefonu. */
export async function getClinicSettings() {
  const { data, error } = await createAdminClient()
    .from("clinic_settings")
    .select("booking_window_days, cancel_limit_hours, phone")
    .eq("id", 1)
    .maybeSingle();
  if (error) logError("Klinik ayarları okunamadı", error);
  return {
    bookingWindowDays: data?.booking_window_days ?? 30,
    cancelLimitHours: data?.cancel_limit_hours ?? 2,
    phone: data?.phone ?? null,
  };
}

/** Klinik açık olan haftanın günleri (ISO 1-7). */
export async function getOpenWeekdays(): Promise<Set<number>> {
  const { data, error } = await createAdminClient()
    .from("working_hours")
    .select("day_of_week")
    .eq("is_open", true);
  if (error) logError("Çalışma saatleri okunamadı", error);
  return new Set((data ?? []).map((row) => row.day_of_week));
}

/** Boş saatler; hesabı her zaman veritabanı yapar (AGENTS.md). */
export async function getAvailableSlots(doctorId: number, procedureId: number, date: string) {
  const { data, error } = await createAdminClient().rpc("get_available_slots", {
    p_doctor_id: doctorId,
    p_procedure_id: procedureId,
    p_date: date,
  });
  if (error) logError("Boş saatler okunamadı", error);
  return data ?? [];
}

/** Bottan gelen randevu: varsayılan olarak status = pending, source = whatsapp. */
export async function createAppointment(input: {
  patientId: number;
  doctorId: number;
  procedureId: number;
  startsAt: string;
  endsAt: string;
}) {
  const { error } = await createAdminClient().from("appointments").insert({
    patient_id: input.patientId,
    doctor_id: input.doctorId,
    procedure_id: input.procedureId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
  });
  if (error && !["23P01", "RD001"].includes(error.code)) {
    logError("Randevu oluşturulamadı", error);
  }
  return error;
}
