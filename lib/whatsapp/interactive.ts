import { z } from "zod";

// Butonlu ve listeli WhatsApp mesajlarının sınırları ve Graph API gövdesi.
// Sınırlar Meta'nın kuralları (AGENTS.md 7. bölüm). Sınırı aşan mesaj
// gönderilmez; bu dosyadaki şemalar gönderimden önce kontrol eder.

const BODY_MAX = 1024;

const buttonSchema = z.object({
  id: z.string().min(1).max(256),
  title: z.string().trim().min(1).max(20),
});

export const buttonMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(BODY_MAX),
    buttons: z.array(buttonSchema).min(1).max(3),
  })
  .refine(
    (m) => new Set(m.buttons.map((b) => b.title)).size === m.buttons.length,
    { message: "Buton başlıkları birbirinden farklı olmalı." },
  );

const listRowSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().trim().min(1).max(24),
  description: z.string().max(72).optional(),
});

const listSectionSchema = z.object({
  title: z.string().trim().min(1).max(24).optional(),
  rows: z.array(listRowSchema).min(1),
});

export const listMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(BODY_MAX),
    // Listeyi açan butonun metni.
    buttonText: z.string().trim().min(1).max(20),
    sections: z.array(listSectionSchema).min(1).max(10),
  })
  .refine((m) => m.sections.flatMap((s) => s.rows).length <= 10, {
    message: "Liste toplamda en fazla 10 satır olabilir.",
  })
  .refine((m) => m.sections.length === 1 || m.sections.every((s) => s.title), {
    message: "Birden fazla bölüm varsa her bölümün başlığı olmalı.",
  });

export type ButtonMessage = z.infer<typeof buttonMessageSchema>;
export type ListMessage = z.infer<typeof listMessageSchema>;

/** Graph API'nin beklediği "interactive" alanı (butonlu mesaj). */
export function toButtonInteractive(message: ButtonMessage) {
  return {
    type: "button",
    body: { text: message.body },
    action: {
      buttons: message.buttons.map((b) => ({
        type: "reply",
        reply: { id: b.id, title: b.title },
      })),
    },
  };
}

/** Graph API'nin beklediği "interactive" alanı (listeli mesaj). */
export function toListInteractive(message: ListMessage) {
  return {
    type: "list",
    body: { text: message.body },
    action: { button: message.buttonText, sections: message.sections },
  };
}

export type ListRow = z.infer<typeof listRowSchema>;

// "Diğer ..." satırının id'si: "more:<sonraki sayfa numarası>".
export const MORE_ROW_PREFIX = "more:";

/**
 * 10'dan fazla seçeneği liste sınırına sığdırır. Son sayfa değilse 9 seçenek
 * ve sonuna "Diğer ..." satırı koyar (başlığı çağıran verir, ör. messages.ts'teki
 * listRows.otherTimes). Sayfa numarası 0'dan başlar. Hasta "Diğer" satırını
 * seçince gelen id `parseMoreRowId` ile sonraki sayfa numarasına çevrilir.
 */
export function paginateRows(rows: ListRow[], page: number, moreTitle: string): ListRow[] {
  const PAGE_SIZE = 9;
  if (rows.length <= 10) return rows;

  const start = page * PAGE_SIZE;
  const remaining = rows.length - start;
  // Kalan 10 veya daha azsa hepsi sığar, "Diğer" satırına gerek yok.
  if (remaining <= 10) return rows.slice(start);

  return [
    ...rows.slice(start, start + PAGE_SIZE),
    { id: `${MORE_ROW_PREFIX}${page + 1}`, title: moreTitle },
  ];
}

/** "more:2" → 2. "Diğer" satırı değilse null. */
export function parseMoreRowId(id: string): number | null {
  if (!id.startsWith(MORE_ROW_PREFIX)) return null;
  const page = Number(id.slice(MORE_ROW_PREFIX.length));
  return Number.isInteger(page) && page >= 0 ? page : null;
}
