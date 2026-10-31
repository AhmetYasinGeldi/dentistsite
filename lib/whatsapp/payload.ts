import { z } from "zod";

// WhatsApp Cloud API webhook gövdesinin bizim kullandığımız kısmı.
// Bilinmeyen alanlar yok sayılır; mesaj tipleri ileride genişletilebilir.

const incomingMessageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
});

const changeValueSchema = z.object({
  messaging_product: z.literal("whatsapp"),
  messages: z.array(incomingMessageSchema).optional(),
  // İletildi/okundu bildirimleri: işlenmez, sadece varlıkları bilinir.
  statuses: z.array(z.unknown()).optional(),
});

export const webhookPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      changes: z.array(z.object({ field: z.string(), value: changeValueSchema })),
    }),
  ),
});

export type IncomingMessage = z.infer<typeof incomingMessageSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

/** Gövdedeki tüm gelen mesajları düz liste olarak döndürür (statuses hariç). */
export function extractMessages(payload: WebhookPayload): IncomingMessage[] {
  return payload.entry.flatMap((entry) =>
    entry.changes.flatMap((change) => change.value.messages ?? []),
  );
}
