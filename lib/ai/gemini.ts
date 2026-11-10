import "server-only";

import { GoogleGenAI } from "@google/genai";
import {
  buildIntentPrompt,
  intentJsonSchema,
  parseIntentResponse,
  type ParsedIntent,
} from "@/lib/ai/intent";

// Gemini çağrısı. Anahtar ve model adı ortam değişkenlerinden okunur.
// Hata fırlatmaz: anahtar yoksa, çağrı başarısızsa, zaman aşımında veya cevap
// doğrulanamazsa null döner; akış butonlu menüye geri döner (AGENTS.md).

const TIMEOUT_MS = 8000;
const MAX_MESSAGE_LENGTH = 500;

let client: GoogleGenAI | null = null;

/**
 * Hastanın serbest metnini yapılandırılmış veriye çevirir. Gemini'ye sadece
 * mesaj metni gider; hastanın adı veya telefonu gönderilmez.
 */
export async function understandMessage(
  message: string,
  context: { upcoming: { date: string; isoWeekday: number }[]; procedures: string[] },
): Promise<ParsedIntent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) {
    console.error("[ai/gemini] GEMINI_API_KEY veya GEMINI_MODEL tanımlı değil.");
    return null;
  }
  client ??= new GoogleGenAI({ apiKey });

  try {
    const response = await client.models.generateContent({
      model,
      contents: message.slice(0, MAX_MESSAGE_LENGTH),
      config: {
        systemInstruction: buildIntentPrompt(context),
        responseMimeType: "application/json",
        responseJsonSchema: intentJsonSchema,
        temperature: 0,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    const parsed = parseIntentResponse(response.text ?? "", context.procedures);
    // Hasta mesajı sağlık bilgisi içerebilir; log'a metnin kendisi yazılmaz.
    if (!parsed) console.error("[ai/gemini] Gemini cevabı doğrulanamadı.");
    return parsed;
  } catch (error) {
    console.error(
      "[ai/gemini] Gemini çağrısı başarısız:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
