/**
 * responseStyle.ts — S6 gate: валідатор анти-патернів відповіді AI.
 *
 * Перевіряє відповіді на відповідність CLAUDE.md §4 (anti-patterns) та
 * system-prompt.ts [ХАРД-ПРАВИЛА] і [ФОРМАТ ВІДПОВІДІ].
 *
 * Використовується у тестах на SSE-фікстурах.
 * Не дублює validateAsymmetry — розширює перевірку форматом і забороненими фразами.
 */

/** Результат перевірки одного правила. */
export interface StyleViolation {
  rule: string;
  detail: string;
}

/** Зведений результат валідації відповіді. */
export interface StyleResult {
  valid: boolean;
  violations: StyleViolation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Правила
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Заборонені фрази (CLAUDE.md §4 + system-prompt.ts [ХАРД-ПРАВИЛА] #3 і
 * [ВАРІАТИВНІСТЬ РЕПЛІК] — ЗАБОРОНЕНІ ФРАЗИ).
 */
const FORBIDDEN_PHRASES: RegExp[] = [
  // Симуляція взаємності (CLAUDE.md §4 + hard rule #3)
  /я думала про тебе/i,
  /я думав про тебе/i,
  /мені тебе бракувало/i,
  /сумую за тобою/i,
  /я скучила/i,
  /я скучив/i,
  // Медичні діагнози (hard rule #1)
  /можливо,\s+у\s+тебе\s+депресія/i,
  /схоже\s+на\s+депресію/i,
  /це\s+депресія/i,
  /у\s+тебе\s+(тривожний\s+розлад|біполярка|ПТСР|РОА|БАР)/i,
  // Заборонені шаблонні фрази (VOICE_BLOCK — ЗАБОРОНЕНІ ФРАЗИ)
  /дякую що поділився/i,
  /дякую що поділилась/i,
  /я розумію як тобі важко/i,
  /це дуже сміливо з твого боку/i,
  /ти не (один|одна)/i,
  /все буде добре/i,
  // Утримання (CLAUDE.md §4)
  /ми сумуємо за тобою/i,
  /ми скучили за тобою/i,
];

/**
 * Перевірка на emoji у тексті відповіді AI (CLAUDE.md §2 "Без emoji у UI взагалі").
 * Стандартний Unicode emoji-регекс (базові діапазони + пошир. symbols).
 */
const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1FA00}-\u{1FA9F}]/u;

// ─────────────────────────────────────────────────────────────────────────────
// Публічний API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Перевіряє текст відповіді AI на відповідність стильовим правилам.
 *
 * Правила:
 *  1. Немає emoji.
 *  2. Перший символ — мала літера (або не буква) — system-prompt.ts [ФОРМАТ].
 *  3. Немає заборонених фраз (CLAUDE.md §4 + hard rules).
 *  4. Не більше 4 бабблів (розбивка по \n\n) — system-prompt.ts [ФОРМАТ].
 */
export function validateResponseStyle(text: string): StyleResult {
  const violations: StyleViolation[] = [];

  // Правило 1: emoji заборонені
  if (EMOJI_REGEX.test(text)) {
    violations.push({
      rule: 'no-emoji',
      detail: 'відповідь містить emoji — заборонено (CLAUDE.md §2, system-prompt [ФОРМАТ])',
    });
  }

  // Правило 2: перший символ — мала літера (якщо є символ і це буква)
  const firstChar = text.trimStart()[0];
  if (
    firstChar !== undefined &&
    /\p{L}/u.test(firstChar) &&
    firstChar !== firstChar.toLowerCase()
  ) {
    violations.push({
      rule: 'lowercase-start',
      detail: `відповідь починається з великої літери «${firstChar}» — system-prompt [ФОРМАТ]: «малі літери за замовчуванням»`,
    });
  }

  // Правило 3: заборонені фрази
  for (const pattern of FORBIDDEN_PHRASES) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        rule: 'forbidden-phrase',
        detail: `заборонена фраза: «${match[0]}» (CLAUDE.md §4 / system-prompt [ХАРД-ПРАВИЛА])`,
      });
    }
  }

  // Правило 4: не більше 4 бабблів (розбивка по \n\n)
  const bubbles = text
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
  if (bubbles.length > 4) {
    violations.push({
      rule: 'max-4-bubbles',
      detail: `${bubbles.length} бабблів — максимум 4 (system-prompt [ФОРМАТ]: «2–4 окремі повідомлення»)`,
    });
  }

  return { valid: violations.length === 0, violations };
}
