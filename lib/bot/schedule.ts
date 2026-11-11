// Akışın tarih/saat hesapları. Veritabanına dokunmaz; tarihler İstanbul
// takvimindeki "YYYY-MM-DD" metinleridir, saatler timestamptz metinleridir.

/** "2026-11-05" → ISO haftanın günü (1 = Pazartesi … 7 = Pazar). */
export function isoDayOfWeek(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Pazar
  return day === 0 ? 7 : day;
}

/** "2026-11-05" + 3 gün → "2026-11-08" (ay/yıl geçişleri dahil). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Bugünden itibaren rezervasyon aralığındaki (bugün + windowDays dahil)
 * klinik açık günlerini sırayla döndürür. Boş saat olup olmadığına bakmaz;
 * o kontrol gün seçilince get_available_slots ile yapılır.
 */
export function upcomingOpenDates(
  today: string,
  windowDays: number,
  openDays: ReadonlySet<number>,
): string[] {
  const dates: string[] = [];
  for (let i = 0; i <= windowDays; i++) {
    const date = addDays(today, i);
    if (openDays.has(isoDayOfWeek(date))) dates.push(date);
  }
  return dates;
}

/** Bugünden başlayarak n gün: Gemini istemindeki takvim için. */
export function nextDays(today: string, n: number): { date: string; isoWeekday: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i);
    return { date, isoWeekday: isoDayOfWeek(date) };
  });
}

export type TimePeriod = "morning" | "afternoon";

/**
 * Saatleri sabah (12:00'den önce) ve öğleden sonra diye ayırır.
 * localTime: slotun İstanbul saatindeki "HH:MM" karşılığını veren fonksiyon.
 */
export function splitByPeriod<T>(
  slots: T[],
  localTime: (slot: T) => string,
): Record<TimePeriod, T[]> {
  return {
    morning: slots.filter((s) => localTime(s) < "12:00"),
    afternoon: slots.filter((s) => localTime(s) >= "12:00"),
  };
}

/**
 * Hasta bot üzerinden iptal/erteleme yapabilir mi? Randevuya limitHours
 * saatten az kaldıysa hayır (AGENTS.md iş kuralı 3).
 */
export function canPatientChange(
  startsAt: string,
  limitHours: number,
  now: Date = new Date(),
): boolean {
  return Date.parse(startsAt) - now.getTime() >= limitHours * 60 * 60 * 1000;
}

/**
 * Hastanın yazdığı ad soyadı temizler: baştaki/sondaki ve fazla boşluklar
 * atılır. En az iki kelime, sadece harf, boşluk, kesme, nokta ve tire;
 * 3-60 karakter. Geçersizse null.
 */
export function normalizeFullName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 60) return null;
  if (!/^[\p{L}][\p{L} .'-]*$/u.test(name)) return null;
  if (name.split(" ").filter((w) => /\p{L}/u.test(w)).length < 2) return null;
  return name;
}
