// Gemini test seti: dataset.json'daki mesajları Gemini'ye sorar ve botun
// kullandığı istem/şema/doğrulama ile (lib/ai/intent.ts) beklenen cevapla
// karşılaştırır.
//
// Çalıştırma (proje kök dizininde, Node 22.18+ veya --experimental-strip-types ile):
//   node --env-file=.env.local --experimental-strip-types scripts/gemini-test/run.mjs
// Seçenekler (ortam değişkeni):
//   GEMINI_TEST_LIMIT=10       sadece ilk 10 vakayı dene
//   GEMINI_TEST_DELAY_MS=4000  istekler arası bekleme (ücretsiz kota için)
// Anahtar ve model .env.local'dan (GEMINI_API_KEY, GEMINI_MODEL) okunur;
// çıktıya anahtar yazılmaz.

import { readFile } from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";
import {
  buildIntentPrompt,
  intentJsonSchema,
  parseIntentResponse,
} from "../../lib/ai/intent.ts";
import { nextDays } from "../../lib/bot/schedule.ts";

const FIELDS = ["intent", "procedure", "date", "time_of_day", "time"];

// supabase/02_seed.sql'deki işlemler (canlıdaki listeyle aynı olmalı).
const PROCEDURES = [
  "Muayene",
  "Diş Taşı Temizliği",
  "Dolgu",
  "Basit Diş Çekimi",
  "Diş Beyazlatma",
  "Kanal Tedavisi",
  "Gömülü Diş Çekimi",
  "İmplant",
  "Ortodonti Muayenesi",
  "Tel/Plak Kontrolü",
];

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;
if (!apiKey || !model) {
  console.error("GEMINI_API_KEY ve GEMINI_MODEL tanımlı olmalı (.env.local).");
  process.exit(1);
}
const limit = Number(process.env.GEMINI_TEST_LIMIT) || Infinity;
const delayMs = Number(process.env.GEMINI_TEST_DELAY_MS ?? 4000);

const dataset = JSON.parse(
  await readFile(new URL("./dataset.json", import.meta.url), "utf8"),
);
const cases = dataset.cases.slice(0, limit);
const systemInstruction = buildIntentPrompt({
  upcoming: nextDays(dataset.today, 15),
  procedures: PROCEDURES,
});
const ai = new GoogleGenAI({ apiKey });

const fieldHits = Object.fromEntries(FIELDS.map((f) => [f, 0]));
let fullHits = 0;
let invalid = 0;
const failures = [];

console.log(`Model: ${model} | bugün: ${dataset.today} | vaka: ${cases.length}\n`);

for (const [i, item] of cases.entries()) {
  let parsed = null;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: item.message,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: intentJsonSchema,
        temperature: 0,
      },
    });
    parsed = parseIntentResponse(response.text ?? "", PROCEDURES);
  } catch (error) {
    console.error(`#${item.id} istek hatası: ${error instanceof Error ? error.message : error}`);
  }

  if (!parsed) {
    invalid++;
    failures.push({ id: item.id, message: item.message, wrong: ["(geçersiz cevap)"] });
  } else {
    const wrong = FIELDS.filter((f) => parsed[f] !== item.expected[f]);
    for (const f of FIELDS) if (!wrong.includes(f)) fieldHits[f]++;
    if (wrong.length === 0) fullHits++;
    else {
      failures.push({
        id: item.id,
        message: item.message,
        wrong: wrong.map((f) => `${f}: beklenen ${item.expected[f]} / gelen ${parsed[f]}`),
      });
    }
  }
  process.stdout.write(`\r${i + 1}/${cases.length}`);
  if (i < cases.length - 1) await new Promise((r) => setTimeout(r, delayMs));
}

const pct = (n) => `${((100 * n) / cases.length).toFixed(1)}%`;
console.log("\n\n=== Sonuç ===");
console.log(`Tam doğru: ${fullHits}/${cases.length} (${pct(fullHits)})`);
for (const f of FIELDS) console.log(`  ${f.padEnd(12)} ${pct(fieldHits[f])}`);
console.log(`Geçersiz/başarısız cevap: ${invalid}`);

if (failures.length > 0) {
  console.log("\n=== Uyuşmayanlar ===");
  for (const f of failures) {
    console.log(`#${f.id} "${f.message}"`);
    for (const w of f.wrong) console.log(`    ${w}`);
  }
}
