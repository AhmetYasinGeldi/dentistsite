import { createAdminClient } from "@/lib/supabase/admin";
import { handleEcho } from "@/lib/bot/echo";
import { touchSession } from "@/lib/bot/session";
import {
  extractMessages,
  getMessageText,
  webhookPayloadSchema,
  type IncomingMessage,
} from "@/lib/whatsapp/payload";
import { isValidSignature } from "@/lib/whatsapp/verify";

// GET: Meta'nın webhook doğrulaması.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

// POST: gelen mesajlar ve durum bildirimleri.
export async function POST(request: Request) {
  // İmza ham gövde üzerinden hesaplanır; önce metin olarak oku, sonra parse et.
  const rawBody = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.error("[webhook] WHATSAPP_APP_SECRET tanımlı değil.");
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isValidSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // İmza geçtikten sonra her durumda 200 dönülür; yoksa Meta aynı olayı tekrar yollar.
  try {
    const parsed = webhookPayloadSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      console.error("[webhook] Beklenmeyen gövde:", parsed.error.issues);
      return ok();
    }

    // statuses (iletildi/okundu) olayları burada boş liste verir ve işlenmez.
    for (const message of extractMessages(parsed.data)) {
      await processMessage(message);
    }
  } catch (error) {
    console.error("[webhook] İşlem hatası:", error);
  }
  return ok();
}

async function processMessage(message: IncomingMessage): Promise<void> {
  const supabase = createAdminClient();

  // Tekrar gelen mesajı yakala: wa_message_id tekil, 23505 = zaten işlendi.
  const { error: insertError } = await supabase.from("wa_messages").insert({
    phone: message.from,
    direction: "in",
    wa_message_id: message.id,
    body: getMessageText(message),
    payload: message,
  });
  if (insertError) {
    if (insertError.code !== "23505") {
      console.error("[webhook] Gelen mesaj kaydedilemedi:", insertError);
    }
    return;
  }

  // Numara ilk kez yazıyorsa oturum "idle" adımıyla oluşur.
  await touchSession(message.from);

  await handleEcho(message);
}

function ok() {
  return new Response("OK", { status: 200 });
}
