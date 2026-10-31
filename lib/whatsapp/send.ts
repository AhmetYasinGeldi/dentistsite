import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SendResult =
  | { ok: true; waMessageId: string | null }
  | {
      ok: false;
      reason: "WINDOW_CLOSED" | "API_ERROR" | "NETWORK_ERROR" | "CONFIG_ERROR";
    };

// Meta'nın "24 saat penceresi dışında" hata kodu.
const WINDOW_CLOSED_CODE = 131047;

/**
 * Hastaya düz metin mesaj gönderir ve başarılıysa wa_messages'a "out" kaydı düşer.
 * Hata fırlatmaz; sonucu döndürür, ayrıntıyı sunucu log'una yazar.
 */
export async function sendTextMessage(to: string, body: string): Promise<SendResult> {
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

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      }),
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
    .insert({ phone: to, direction: "out", wa_message_id: waMessageId, body });
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
