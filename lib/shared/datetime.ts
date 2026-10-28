// Tarih/saat yardımcıları. Tüm hesaplar klinik saat diliminde (Europe/Istanbul)
// yapılır; sunucunun saat dilimi (Vercel'de UTC) sonucu etkilemez.

export const CLINIC_TIME_ZONE = "Europe/Istanbul";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: CLINIC_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: CLINIC_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// en-CA biçimi "YYYY-MM-DD" verir.
const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  timeZoneName: "longOffset",
});

function toDate(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Geçersiz tarih: ${String(value)}`);
  }
  return date;
}

/** İstanbul'a göre bugünün tarihi: "2026-11-05" */
export function todayInIstanbul(now: Date = new Date()): string {
  return isoDateFormatter.format(now);
}

/** timestamptz → "5 Kasım 2026 Perşembe, 10:30" */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;
}

/** timestamptz → "5 Kasım 2026 Perşembe" */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(toDate(value));
}

/** timestamptz → "10:30" */
export function formatTime(value: string | Date): string {
  return timeFormatter.format(toDate(value));
}

/** Verilen andaki İstanbul ofsetini "+03:00" biçiminde döndürür. */
function istanbulOffset(date: Date): string {
  const name =
    offsetFormatter.formatToParts(date).find((p) => p.type === "timeZoneName")
      ?.value ?? "GMT";
  // "GMT+03:00" veya ofset sıfırsa "GMT"
  const offset = name.replace("GMT", "");
  return offset === "" ? "+00:00" : offset;
}

function offsetToMinutes(offset: string): number {
  const sign = offset.startsWith("-") ? -1 : 1;
  const [hours, minutes] = offset.slice(1).split(":").map(Number);
  return sign * (hours * 60 + minutes);
}

/**
 * İstanbul yerel tarih + saatini ISO timestamptz string'ine çevirir.
 * istanbulLocalToIso("2026-11-05", "10:30") → "2026-11-05T10:30:00+03:00"
 */
export function istanbulLocalToIso(date: string, time: string): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new Error(`Geçersiz tarih/saat: ${date} ${time}`);
  }

  const [, y, m, d] = dateMatch.map(Number);
  const [, hh, mm] = timeMatch.map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  if (new Date(asUtc).toISOString().slice(0, 10) !== date) {
    throw new Error(`Geçersiz tarih: ${date}`);
  }

  // Ofseti, yerel saatin UTC'deki yaklaşık karşılığına göre bul.
  const guessOffset = istanbulOffset(new Date(asUtc));
  const offset = istanbulOffset(
    new Date(asUtc - offsetToMinutes(guessOffset) * 60_000),
  );

  return `${date}T${time}:00${offset}`;
}
