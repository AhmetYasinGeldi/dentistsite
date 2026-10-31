// Botun sohbet adımları. wa_sessions.step sütunu bu değerlerden birini tutar.
// lib/bot/messages.ts'teki metin anahtarları bu isimlerle birebir aynıdır;
// bir adım eklenir veya adı değişirse iki dosya birlikte güncellenir.

export const STEPS = [
  // Sohbet başlamadı ya da bir iş bitti (veritabanındaki varsayılan değer).
  "idle",
  "menu",

  // A) Randevu alma
  "ask_name", // sadece patients tablosunda kaydı olmayan numaraya sorulur
  "choose_procedure",
  "choose_doctor", // işlemi yapan tek doktor varsa atlanır
  "choose_date",
  "choose_time_period", // o günün boş saatleri 10'dan fazlaysa: sabah / öğleden sonra
  "choose_time",
  "confirm", // özet + Onayla / Değiştir / Vazgeç

  // C) İptal / Ertele
  "manage_appointment",
  "confirm_cancel",
  "reschedule_date",
  "reschedule_time",
  "confirm_reschedule",
] as const;

export type Step = (typeof STEPS)[number];

/** Veritabanından okunan metnin geçerli bir adım olup olmadığını kontrol eder. */
export function isStep(value: string): value is Step {
  return (STEPS as readonly string[]).includes(value);
}
