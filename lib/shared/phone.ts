// Telefon numaraları veritabanında WhatsApp biçiminde tutulur: "+" olmadan,
// sadece rakam, ülke koduyla (örn. 905321234567).

/**
 * Girilen numarayı "905321234567" biçimine çevirir; geçersizse null döner.
 * Kabul edilenler: "0532 123 45 67", "+90 532 123 45 67", "5321234567",
 * "905321234567", "0090 532 ...". "+" veya "00" ile başlayan yabancı
 * numaralar 10-15 hane ise olduğu gibi kabul edilir.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  const hasIntlPrefix = trimmed.startsWith("+") || digits.startsWith("00");

  if (digits.startsWith("00")) digits = digits.slice(2);

  // Türkiye cep numarası: ülke kodu sonrası 10 hane, 5 ile başlar.
  if (/^5\d{9}$/.test(digits)) return `90${digits}`;
  if (/^05\d{9}$/.test(digits)) return `9${digits}`;
  if (/^905\d{9}$/.test(digits)) return digits;

  if (hasIntlPrefix && !digits.startsWith("90") && /^\d{10,15}$/.test(digits)) {
    return digits;
  }

  return null;
}

/** "905321234567" → "+90 532 123 45 67". Tanınmayan biçimde "+<rakamlar>". */
export function formatPhone(phone: string): string {
  const match = /^90(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  if (match) {
    const [, a, b, c, d] = match;
    return `+90 ${a} ${b} ${c} ${d}`;
  }
  return `+${phone}`;
}
