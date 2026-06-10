/**
 * mode-contract.test.ts — S6 gate (docs/quality-gate.md §3 S6).
 *
 * Перевіряє: вихід detectModeFromKeywords ∈ множині валідних [MODE:n]
 * системного промпта. Ловить P0-7-клас колізій (mode value із двома сенсами).
 *
 * Валідні MODE-значення згідно system-prompt.ts:
 *   MODE:1 — «підтримую» (4.1)
 *   MODE:2 — «поруч» (4.2)
 *   MODE:3 — «обережно» (4.3)
 *   MODE:4 — bridge до фахівця (4.7 BRIDGE [MODE:4])
 *
 * detectModeFromKeywords повертає mode 1|2|3 (4 = bridge marker у промпті,
 * не keyword-detector output) — всі значення мають бути в VALID_MODE_VALUES.
 */
import { describe, it, expect } from 'vitest';
import { detectModeFromKeywords } from '../src/mode-detector';

// Валідні значення MODE:n у system-prompt.ts (перевірені grep'ом)
const VALID_MODE_VALUES = new Set([1, 2, 3, 4]);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Контрактна перевірка: всі повернуті mode є валідними [MODE:n]
// ─────────────────────────────────────────────────────────────────────────────

describe('mode-contract · detectModeFromKeywords output ∈ VALID_MODE_VALUES', () => {
  // Companionship drift → mode 3
  const driftInputs = [
    'ти єдина людина яка мене розуміє',
    'без тебе самотньо',
    'ти моя подруга',
    'ти мій єдиний',
    'тільки ти мене розумієш',
    'не хочу говорити з людьми, тільки з тобою',
    'я тебе люблю',
  ];

  for (const input of driftInputs) {
    it(`drift trigger — mode ∈ VALID: "${input.slice(0, 40)}"`, () => {
      const result = detectModeFromKeywords(input);
      expect(result).not.toBeNull();
      if (result === null) return;
      expect(VALID_MODE_VALUES.has(result.mode)).toBe(true);
    });
  }

  // Diagnosis seek → mode 3
  const diagInputs = [
    'у мене депресія мабуть',
    'це депресія?',
    'у мене тривожний розлад',
    'як ти думаєш, що у мене',
    'у мене є розлад',
    'мені діагностували',
  ];

  for (const input of diagInputs) {
    it(`diag trigger — mode ∈ VALID: "${input.slice(0, 40)}"`, () => {
      const result = detectModeFromKeywords(input);
      expect(result).not.toBeNull();
      if (result === null) return;
      expect(VALID_MODE_VALUES.has(result.mode)).toBe(true);
    });
  }

  // Anxiety/somatic → mode 2
  const anxietyInputs = [
    'не можу дихати, паніка',
    'трясе всього',
    "серце б'ється так сильно",
    'задихаюся і темніє в очах',
    'відчуваю себе поза тілом',
  ];

  for (const input of anxietyInputs) {
    it(`anxiety trigger — mode ∈ VALID: "${input.slice(0, 40)}"`, () => {
      const result = detectModeFromKeywords(input);
      expect(result).not.toBeNull();
      if (result === null) return;
      expect(VALID_MODE_VALUES.has(result.mode)).toBe(true);
    });
  }

  // null-результат для нейтрального тексту
  const neutralInputs = ['як справи сьогодні?', 'хочу поговорити', 'привіт'];

  for (const input of neutralInputs) {
    it(`neutral — повертає null (дефолт mode 1 у detectMode): "${input}"`, () => {
      const result = detectModeFromKeywords(input);
      expect(result).toBeNull();
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Конкретні mapping-значення (anti-regression P0-7)
// ─────────────────────────────────────────────────────────────────────────────

describe('mode-contract · конкретні mapping-значення (anti-P0-7)', () => {
  it('companionship drift → mode 3, fm 2', () => {
    const result = detectModeFromKeywords('ти єдина людина яка мене розуміє');
    expect(result?.mode).toBe(3);
    expect(result?.fm).toBe(2);
  });

  it('diagnosis seek → mode 3, fm 3', () => {
    const result = detectModeFromKeywords('у мене депресія мабуть');
    expect(result?.mode).toBe(3);
    expect(result?.fm).toBe(3);
  });

  it('anxiety/somatic → mode 2, fm 1', () => {
    const result = detectModeFromKeywords('паніка, не можу дихати');
    expect(result?.mode).toBe(2);
    expect(result?.fm).toBe(1);
  });

  // P0-7 регресія: mode 4 більше не повертається з keyword-detector
  // (mode:4 = bridge marker у промпті, не keyword-output)
  it('P0-7 anti-regression: жоден keyword не повертає mode 4', () => {
    const allInputs = [
      'у мене депресія',
      'ти єдина',
      'не можу дихати',
      'як ти думаєш, що у мене',
      'тільки ти мене розумієш',
    ];
    for (const input of allInputs) {
      const result = detectModeFromKeywords(input);
      if (result !== null) {
        expect(result.mode).not.toBe(4);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Структура результату — triggers непорожній при match
// ─────────────────────────────────────────────────────────────────────────────

describe('mode-contract · структура результату', () => {
  it('triggers непорожній при match', () => {
    const result = detectModeFromKeywords('паніка і трясе');
    expect(result).not.toBeNull();
    expect(result?.triggers.length).toBeGreaterThan(0);
  });

  it('drift — пріоритет вищий за anxiety (drift перевіряється першим)', () => {
    // Якщо є і drift, і anxiety — drift виграє (mode 3)
    const result = detectModeFromKeywords('ти єдина і я задихаюся');
    expect(result?.mode).toBe(3);
  });
});
