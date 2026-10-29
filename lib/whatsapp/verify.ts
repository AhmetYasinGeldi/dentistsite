import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Meta'nın gönderdiği X-Hub-Signature-256 başlığını doğrular.
 * Başlık biçimi: "sha256=<hex>". İmza, ham (parse edilmemiş) gövde üzerinden
 * uygulama sırrı (WHATSAPP_APP_SECRET) ile HMAC-SHA256 olarak hesaplanır.
 */
export function isValidSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const received = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();

  // Uzunluk farklıysa timingSafeEqual hata fırlatır; önce kontrol et.
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}
