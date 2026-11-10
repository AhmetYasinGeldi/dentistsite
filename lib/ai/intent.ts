import { z } from "zod";

// Gemini'nin hastanın serbest metnini çevirdiği yapı (AGENTS.md 8. bölüm).
// Bu dosya anahtar ve ağ çağrısı içermez: istem metni, cevap şeması ve
// doğrulama burada; çağrının kendisi lib/ai/gemini.ts'te. Test scripti
// (scripts/gemini-test/run.mjs) de bu dosyayı kullanır, o yüzden sadece
// zod'a bağımlıdır.

export const INTENTS = ["book", "view", "cancel", "reschedule", "greeting", "other"] as const;

export const parsedIntentSchema = z.object({
  intent: z.enum(INTENTS),
  procedure: z.string().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  time_of_day: z.enum(["morning", "afternoon"]).nullable(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
});

export type ParsedIntent = z.infer<typeof parsedIntentSchema>;

/** Gemini'ye verilen JSON şeması (responseJsonSchema). */
export const intentJsonSchema = {
  type: "object",
  properties: {
    intent: { type: "string", enum: [...INTENTS] },
    procedure: { type: ["string", "null"] },
    date: { type: ["string", "null"], description: "YYYY-MM-DD" },
    time_of_day: { anyOf: [{ type: "string", enum: ["morning", "afternoon"] }, { type: "null" }] },
    time: { type: ["string", "null"], description: "HH:MM, 24 saat" },
  },
  required: ["intent", "procedure", "date", "time_of_day", "time"],
};

const WEEKDAYS = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/**
 * Sistem istemi. upcoming: bugünden başlayarak önümüzdeki günler
 * (isoWeekday 1 = Pazartesi). Göreli tarihleri ("yarın", "cuma") model
 * hesaplamasın diye takvim hazır verilir.
 */
export function buildIntentPrompt(input: {
  upcoming: { date: string; isoWeekday: number }[];
  procedures: string[];
}): string {
  const calendar = input.upcoming
    .map((d, i) => {
      const note = i === 0 ? " (bugün)" : i === 1 ? " (yarın)" : "";
      return `- ${d.date} ${WEEKDAYS[d.isoWeekday]}${note}`;
    })
    .join("\n");

  return `Bir diş kliniğinin WhatsApp randevu botu için hastanın mesajını yapılandırılmış veriye çeviriyorsun. Hastaya cevap yazmıyorsun; sadece istenen JSON'u döndür.

Takvim (İstanbul):
${calendar}

Klinikteki işlemler (procedure alanında sadece bunlardan biri, harfi harfine, ya da null):
${input.procedures.map((p) => `- ${p}`).join("\n")}

Alanlar:
- intent:
  - "book": yeni randevu istiyor veya randevu almak için müsaitlik soruyor (şikayet bildirip gelmek istemesi dahil).
  - "view": mevcut randevusunu öğrenmek istiyor (ne zaman, saat kaç, hangi doktor, onaylandı mı).
  - "cancel": mevcut randevusunu iptal etmek istiyor.
  - "reschedule": mevcut randevusunu başka gün/saate almak istiyor.
  - "greeting": sadece selamlaşma (merhaba, selam, günaydın…).
  - "other": diğer her şey (fiyat, adres, çalışma saatleri, sağlık sorusu, teşekkür, alakasız mesaj).
- procedure: Mesajda bir işlem geçiyorsa listedeki adı. Ağrı, zonklama, kırık diş, acil gibi şikayetlerde "Muayene". İşlem anlaşılmıyorsa null. book dışındaki intent'lerde null.
- date: Mesajda tek bir gün belirtilmişse takvimden YYYY-MM-DD. "yarın", "cuma", "5 kasım" gibi. Gün adı tek başına geçiyorsa takvimdeki ilk o gün (bugün o günse bugün). "haftaya <gün>" bir sonraki haftanın o günü. "bu hafta", "haftaya", "en yakın zamanda" gibi tek bir günü göstermeyen ifadelerde null. Geçmiş bir gün ("dün") için null.
- time_of_day: "sabah", "öğleden önce" → "morning"; "öğleden sonra", "öğlen sonrası", "akşamüstü" → "afternoon". Belirli bir saat (time) verildiyse null. Belirtilmemişse null.
- time: Sadece belirli bir saat söylendiyse 24 saat biçiminde HH:MM ("14 gibi" → "14:00", "10 da" → "10:00", "15:30"). "17'den sonra", "10-12 arası" gibi kesin olmayan ifadelerde null.

Emin olmadığın alanı null bırak. Sadece JSON döndür.`;
}

/**
 * Gemini'nin cevap metnini doğrular. JSON değilse, şemaya uymuyorsa veya
 * işlem listede yoksa null döner (çağıran taraf menüye döner).
 */
export function parseIntentResponse(raw: string, procedures: string[]): ParsedIntent | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = parsedIntentSchema.safeParse(json);
  if (!parsed.success) return null;
  const { procedure } = parsed.data;
  if (procedure !== null && !procedures.includes(procedure)) return null;
  return parsed.data;
}
