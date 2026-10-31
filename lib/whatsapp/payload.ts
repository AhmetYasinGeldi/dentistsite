import { z } from "zod";

// WhatsApp Cloud API webhook gövdesinin bizim kullandığımız kısmı.
// Bilinmeyen alanlar yok sayılır; mesaj tipleri ileride genişletilebilir.

const incomingMessageSchema = z.object({
  // wa_sessions.phone kısıtıyla aynı: + olmadan 10-15 rakam.
  from: z.string().regex(/^\d{10,15}$/),
  id: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  // Hasta bir butona veya liste satırına bastığında gelir.
  interactive: z
    .object({
      type: z.string(),
      button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
      list_reply: z.object({ id: z.string(), title: z.string() }).optional(),
    })
    .optional(),
});

// Sadece field === "messages" olan değişikliklerin içeriği.
const messagesValueSchema = z.object({
  messaging_product: z.literal("whatsapp"),
  // Mesajlar tek tek doğrulanır (extractMessages); geçersiz biri diğerlerini düşürmez.
  messages: z.array(z.unknown()).optional(),
  // İletildi/okundu bildirimleri: işlenmez, sadece varlıkları bilinir.
  statuses: z.array(z.unknown()).optional(),
});

// Dış kabuk: diğer alanların (ör. şablon durum güncellemeleri) içeriği
// farklı olduğu için value burada doğrulanmaz.
export const webhookPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      changes: z.array(z.object({ field: z.string(), value: z.unknown() })),
    }),
  ),
});

export type IncomingMessage = z.infer<typeof incomingMessageSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

/**
 * Gövdedeki gelen mesajları düz liste olarak döndürür. Sadece "messages"
 * alanı işlenir; diğer alanlar ve statuses sessizce atlanır.
 */
export function extractMessages(payload: WebhookPayload): IncomingMessage[] {
  return payload.entry.flatMap((entry) =>
    entry.changes.flatMap((change) => {
      if (change.field !== "messages") return [];
      const parsed = messagesValueSchema.safeParse(change.value);
      if (!parsed.success) {
        console.error("[webhook] Beklenmeyen mesaj gövdesi:", parsed.error.issues);
        return [];
      }
      return (parsed.data.messages ?? []).flatMap((raw) => {
        const message = incomingMessageSchema.safeParse(raw);
        if (!message.success) {
          console.error("[webhook] Geçersiz mesaj atlandı:", message.error.issues);
          return [];
        }
        return [message.data];
      });
    }),
  );
}

/** Seçilen buton/liste satırının id'si; düz metin mesajda null. */
export function getReplyId(message: IncomingMessage): string | null {
  const reply = message.interactive?.button_reply ?? message.interactive?.list_reply;
  return reply?.id ?? null;
}

/** Mesajın okunabilir metni: yazılan metin ya da seçilen buton/satır başlığı. */
export function getMessageText(message: IncomingMessage): string | null {
  const reply = message.interactive?.button_reply ?? message.interactive?.list_reply;
  return message.text?.body ?? reply?.title ?? null;
}
