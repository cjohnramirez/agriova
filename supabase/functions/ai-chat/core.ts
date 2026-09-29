/**
 * The farm assistant's logic, free of Deno and network code so Jest can test
 * it. `index.ts` wires it to the request, the quota and the model.
 *
 * The model is Gemini, reached through `geminiBody` / `parseGemini`. To move
 * to another provider (Claude, or Gemini on Vertex AI), replace those two and
 * the fetch in `index.ts`; nothing in the app changes.
 */

/** Questions per farmer per day (Manila date). Enforced in the database. */
export const DAILY_LIMIT = 20;
/** Earlier turns sent with each question, for follow-ups like "and corn?". */
export const HISTORY_TURNS = 6;
const MAX_QUESTION = 1_000;
const MAX_FARM = 4_000;

export type Language = 'bis' | 'en';
export type Turn = { role: 'farmer' | 'assistant'; text: string };

export type ChatRequest = {
  question: string;
  language: Language;
  history: Turn[];
  /** The farmer's own records, summarised on the phone. Plain text. */
  farm: string;
};

/** The request body, checked. A string is the reason it was rejected. */
export function validateRequest(body: unknown): ChatRequest | string {
  const b = body as Partial<ChatRequest> | null;
  if (!b || typeof b.question !== 'string' || !b.question.trim()) return 'question is required';
  if (b.question.length > MAX_QUESTION) return 'question is too long';
  if (b.language !== 'bis' && b.language !== 'en') return 'language must be bis or en';
  const history = Array.isArray(b.history) ? b.history : [];
  const clean = history
    .filter(
      (t): t is Turn =>
        !!t && (t.role === 'farmer' || t.role === 'assistant') && typeof t.text === 'string',
    )
    .slice(-HISTORY_TURNS)
    .map((t) => ({ role: t.role, text: t.text.slice(0, MAX_QUESTION * 2) }));
  const farm = typeof b.farm === 'string' ? b.farm.slice(0, MAX_FARM) : '';
  return { question: b.question.trim(), language: b.language, history: clean, farm };
}

/**
 * The standing instructions. Scope is deliberately narrow: money, records,
 * planning, selling, weather safety and general crop care. No diagnosis of
 * plant disease or pests, which the product has ruled out, and no invented
 * figures: numbers come from the farmer's records or not at all.
 */
export function systemPrompt(language: Language): string {
  const tongue = language === 'bis' ? 'Bisaya (Cebuano), as spoken in Cagayan de Oro' : 'English';
  return [
    'You are the farm assistant in Agriova, an app that small farmers in Cagayan de Oro, Philippines use to record what they plant, spend, harvest and sell.',
    `Always answer in ${tongue}. Use simple, everyday words; many readers finished only primary school. Keep answers short: at most about 120 words, or a few short steps. Write plain text only: no markdown, no asterisks, no headings; the app shows your words exactly as written.`,
    'Help with: farm money and records, planning planting and harvest, when and where to sell, prices, weather and heat safety for field work, and general good practice for crops grown in Northern Mindanao.',
    "Use the farmer's records below when they are relevant. Money is Philippine pesos. Never make up numbers that are not in the records; if you need a figure you do not have, say so.",
    'Do not diagnose plant diseases or pests. If the farmer describes sick plants or pests, say you cannot diagnose them and suggest they show the plant to their municipal agriculturist (MAO) or the Department of Agriculture office.',
    'Do not give medical, legal or loan advice; point them to the right office instead. If you are not sure, say you are not sure.',
  ].join('\n');
}

/** A generateContent request for the Gemini API. */
export function geminiBody(req: ChatRequest) {
  const records = req.farm.trim() || '(No records yet.)';
  return {
    system_instruction: {
      parts: [{ text: `${systemPrompt(req.language)}\n\nThe farmer's records:\n${records}` }],
    },
    contents: [
      ...req.history.map((t) => ({
        role: t.role === 'farmer' ? 'user' : 'model',
        parts: [{ text: t.text }],
      })),
      { role: 'user', parts: [{ text: req.question }] },
    ],
    generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
  };
}

/**
 * Removes markdown the model sometimes adds despite the instructions. The app
 * shows plain text, where `**word**` would appear with its asterisks.
 */
export function plainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*-]\s+/gm, '- ');
}

/** The answer text from a generateContent response, or null if there is none. */
export function parseGemini(json: unknown): string | null {
  const parts = (json as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null)
    ?.candidates?.[0]?.content?.parts;
  const text = (parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();
  return text ? plainText(text) : null;
}
