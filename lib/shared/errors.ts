// Supabase/PostgreSQL hata kodlarını kullanıcıya gösterilecek Türkçe mesajlara çevirir.
// Kodlar supabase/01_schema.sql ve AGENTS.md'deki hata tablosuyla aynıdır.

export const DB_ERROR_MESSAGES = {
  "23P01": "Bu saat az önce doldu, lütfen başka bir saat seçin.",
  RD001: "Zaten aktif bir randevunuz var.",
  RD002: "Randevu bulunamadı.",
  RD003: "Bu randevu artık aktif değil.",
  RD004: "Seçilen saat müsait değil.",
  "23505": "Bu bilgilerle kayıtlı bir kayıt zaten var.",
} as const;

export type DbErrorCode = keyof typeof DB_ERROR_MESSAGES;

export const DEFAULT_ERROR_MESSAGE = "Bir hata oluştu, lütfen tekrar deneyin.";

/** Hata nesnesinden `code` alanını güvenli şekilde okur. */
export function getErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error as { code: unknown };
    return typeof code === "string" ? code : null;
  }
  return null;
}

export function isDbErrorCode(code: string | null): code is DbErrorCode {
  return code !== null && code in DB_ERROR_MESSAGES;
}

/**
 * Supabase hatasını Türkçe kullanıcı mesajına çevirir. Tanınmayan hatalarda
 * genel mesaj döner; ayrıntılar sadece sunucu log'una yazılmalıdır.
 * 23505 için bağlama göre daha özel bir mesaj gerekiyorsa çağıran taraf seçer.
 */
export function getErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  return isDbErrorCode(code) ? DB_ERROR_MESSAGES[code] : DEFAULT_ERROR_MESSAGE;
}
