import "server-only";

import type { Json } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buttonMessageSchema,
  listMessageSchema,
  toButtonInteractive,
  toListInteractive,
  type ButtonMessage,
  type ListMessage,
} from "@/lib/whatsapp/interactive";

export type SendResult =
  | { ok: true; waMessageId: string | null }
  | {
      ok: false;
      reason:
        | "WINDOW_CLOSED"
        | "API_ERROR"
        | "NETWORK_ERROR"
        | "CONFIG_ERROR"
        | "INVALID_MESSAGE";
    };

// Meta'nın "24 saat penceresi dışında" hata kodu.
const WINDOW_CLOSED_CODE = 131047;
const TEXT_MAX = 4096;

/** Düz metin mesaj gönderir. */
export async function sendText(to: string, body: string): Promise<SendResult> {
  if (body.trim().length === 0 || body.length > TEXT_MAX) {
    console.error("[whatsapp/send] Geçersiz metin uzunluğu:", body.length);
    return { ok: false, reason: "INVALID_MESSAGE" };
  }
  return send(to, { type: "text", text: { body } }, body);
}

/** En fazla 3 butonlu mesaj gönderir (buton başlığı en fazla 20 karakter). */
export async function sendButtons(to: string, message: ButtonMessage): Promise<SendResult> {
  const parsed = buttonMessageSchema.safeParse(message);
  if (!parsed.success) {
    console.error("[whatsapp/send] Geçersiz butonlu mesaj:", parsed.error.issues);
    return { ok: false, reason: "INVALID_MESSAGE" };
  }
  return send(
    to,
    { type: "interactive", interactive: toButtonInteractive(parsed.data) },
    parsed.data.body,
  );
}

/**
 * Listeli mesaj gönderir (toplam en fazla 10 satır, satır başlığı en fazla 24,
 * açıklama en fazla 72 karakter). 10'dan fazla seçenek varsa önce
 * `paginateRows` ile sayfalayın.
 */
export async function sendList(to: string, message: ListMessage): Promise<SendResult> {
  const parsed = listMessageSchema.safeParse(message);
  if (!parsed.success) {
    console.error("[whatsapp/send] Geçersiz listeli mesaj:", parsed.error.issues);
    return { ok: false, reason: "INVALID_MESSAGE" };
  }
  return send(
    to,
    { type: "interactive", interactive: toListInteractive(parsed.data) },
    parsed.data.body,
  );
}

/**
 * Ortak gönderim: Graph API'ye yollar, başarılıysa wa_messages'a "out" kaydı düşer.
 * Hata fırlatmaz; sonucu döndürür, ayrıntıyı sunucu log'una yazar.
 */
async function send(
  to: string,
  content: Record<string, unknown>,
  bodyForLog: string,
): Promise<SendResult> {
  const version = process.env.WHATSAPP_API_VERSION;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!version || !phoneNumberId || !accessToken) {
    // Sadece eksik değişkenlerin ADLARI loglanır, değerleri asla.
    const missing = [
      !version && "WHATSAPP_API_VERSION",
      !phoneNumberId && "WHATSAPP_PHONE_NUMBER_ID",
      !accessToken && "WHATSAPP_ACCESS_TOKEN",
    ].filter(Boolean);
    console.error("[whatsapp/send] Eksik ortam değişkeni:", missing.join(", "));
    return { ok: false, reason: "CONFIG_ERROR" };
  }

  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const requestBody = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    ...content,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error("[whatsapp/send] Ağ hatası:", error);
    return { ok: false, reason: "NETWORK_ERROR" };
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = getGraphErrorCode(data);
    // Token içermeyen hata gövdesini logla; anahtarları asla loglama.
    console.error("[whatsapp/send] Graph API hatası:", response.status, JSON.stringify(data));
    return { ok: false, reason: code === WINDOW_CLOSED_CODE ? "WINDOW_CLOSED" : "API_ERROR" };
  }

  const waMessageId = getSentMessageId(data);
  const { error } = await createAdminClient()
    .from("wa_messages")
    .insert({
      phone: to,
      direction: "out",
      wa_message_id: waMessageId,
      body: bodyForLog,
      payload: content as Json,
    });
  if (error) console.error("[whatsapp/send] Giden mesaj kaydedilemedi:", error);

  return { ok: true, waMessageId };
}

function getGraphErrorCode(data: unknown): number | null {
  if (typeof data !== "object" || data === null || !("error" in data)) return null;
  const { error } = data as { error: unknown };
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const { code } = error as { code: unknown };
  return typeof code === "number" ? code : null;
}

function getSentMessageId(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("messages" in data)) return null;
  const { messages } = data as { messages: unknown };
  if (!Array.isArray(messages)) return null;
  const first: unknown = messages[0];
  if (typeof first !== "object" || first === null || !("id" in first)) return null;
  const { id } = first as { id: unknown };
  return typeof id === "string" ? id : null;
}
