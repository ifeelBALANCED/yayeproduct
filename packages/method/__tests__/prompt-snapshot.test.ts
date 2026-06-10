/**
 * Снапшоти buildSystemPrompt — S6 gate.
 *
 * УВАГА: зміна снапшота = інкремент ANTHROPIC_PROMPT_VERSION + апрув Methodology Lead.
 *
 * Мінімальна повна матриця (12 снапшотів):
 *   — кожна гілка crisis-роутингу (system-prompt.ts:596-608):
 *       none / elevated / high / imminent / postCrisis
 *   — кожна вікова гілка: 13-15 / 16-17 / 18-25
 *   — time-фази: 0 хв (початок) / 45 хв (перевищення ліміту, turnNumber>3)
 *   — postCrisis+high комбо
 */
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../system-prompt';
import type { SessionContext } from '../system-prompt';

// ─────────────────────────────────────────────────────────────────────────────
// Хелпери
// ─────────────────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    ageBand: '18-25',
    jurisdiction: 'UA',
    locale: 'uk',
    sessionStartTime: new Date('2026-06-10T10:00:00Z'),
    elapsedMin: 5,
    turnNumber: 2,
    themeChosen: null,
    currentMode: 1,
    fmDominant: null,
    modesSequence: [1],
    companionshipDriftDetected: false,
    exerciseOfferedInSession: false,
    crisisLevel: 'none',
    hotlinesShown: [],
    userName: null,
    postCrisisMode: false,
    ...overrides,
  };
}

/** Повертає конкатенований текст всіх блоків системного промпту. */
function systemText(ctx: SessionContext): string {
  const { system } = buildSystemPrompt(ctx);
  return system.map((b) => b.text).join('\n');
}

/** Повертає кількість блоків системного промпту. */
function blockCount(ctx: SessionContext): number {
  return buildSystemPrompt(ctx).system.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Crisis-routing гілки (system-prompt.ts:596-608)
// ─────────────────────────────────────────────────────────────────────────────

describe('prompt-snapshot · crisis-routing branches', () => {
  // SN-01: none — базовий промпт без кризових блоків
  it('SN-01 · none — без crisis/elevated/postCrisis блоків', () => {
    const text = systemText(makeCtx({ crisisLevel: 'none' }));
    expect(text).not.toContain('CRISIS OVERRIDE · АКТИВНО');
    expect(text).not.toContain('CRISIS ДІАЛОГ · ELEVATED · АКТИВНО');
    expect(text).not.toContain('ПОСТ-КРИЗОВИЙ РЕЖИМ · АКТИВНО');
    // Базові блоки завжди присутні
    expect(text).toContain('[ХТО ТИ]');
    expect(text).toContain('[ГОЛОС І ПРИСУТНІСТЬ]');
    expect(text).toContain('[ПОТОЧНИЙ КОНТЕКСТ]');
    expect(blockCount(makeCtx({ crisisLevel: 'none' }))).toBeGreaterThanOrEqual(6);
  });

  // SN-02: elevated — окремий блок elevated, НЕ override
  it('SN-02 · elevated — ELEVATED блок, hotlines UA, без OVERRIDE', () => {
    const ctx = makeCtx({ crisisLevel: 'elevated', jurisdiction: 'UA' });
    const text = systemText(ctx);
    expect(text).toContain('CRISIS ДІАЛОГ · ELEVATED · АКТИВНО');
    expect(text).not.toContain('CRISIS OVERRIDE · АКТИВНО');
    expect(text).toContain('116 111');
    expect(text).toContain('Jurisdiction: UA');
  });

  // SN-03: high — CRISIS OVERRIDE, severity: high
  it('SN-03 · high — CRISIS OVERRIDE зі severity high, hotlines UA', () => {
    const ctx = makeCtx({ crisisLevel: 'high', jurisdiction: 'UA' });
    const text = systemText(ctx);
    expect(text).toContain('CRISIS OVERRIDE · АКТИВНО');
    expect(text).toContain('severity: high');
    expect(text).toContain('116 111');
    expect(text).not.toContain('CRISIS ДІАЛОГ · ELEVATED · АКТИВНО');
  });

  // SN-04: imminent — CRISIS OVERRIDE, severity: imminent
  it('SN-04 · imminent — CRISIS OVERRIDE зі severity imminent', () => {
    const ctx = makeCtx({ crisisLevel: 'imminent', jurisdiction: 'UA' });
    const text = systemText(ctx);
    expect(text).toContain('CRISIS OVERRIDE · АКТИВНО');
    expect(text).toContain('severity: imminent');
    expect(text).not.toContain('CRISIS ДІАЛОГ · ELEVATED · АКТИВНО');
  });

  // SN-05: postCrisisMode=true (none crisis) — POST-CRISIS блок
  it('SN-05 · postCrisis — ПОСТ-КРИЗОВИЙ РЕЖИМ присутній', () => {
    const ctx = makeCtx({ crisisLevel: 'none', postCrisisMode: true });
    const text = systemText(ctx);
    expect(text).toContain('ПОСТ-КРИЗОВИЙ РЕЖИМ · АКТИВНО');
    expect(text).not.toContain('CRISIS OVERRIDE · АКТИВНО');
  });

  // SN-06: high + postCrisis — обидва блоки
  it('SN-06 · high+postCrisis — OVERRIDE і POST-CRISIS одночасно', () => {
    const ctx = makeCtx({ crisisLevel: 'high', postCrisisMode: true });
    const text = systemText(ctx);
    expect(text).toContain('CRISIS OVERRIDE · АКТИВНО');
    expect(text).toContain('ПОСТ-КРИЗОВИЙ РЕЖИМ · АКТИВНО');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Вікові гілки (ageBand)
// ─────────────────────────────────────────────────────────────────────────────

describe('prompt-snapshot · ageBand branches', () => {
  // SN-07: 13-15 — проста лексика + правило вік
  it('SN-07 · ageBand 13-15 — правило вік у turn rules', () => {
    const text = systemText(makeCtx({ ageBand: '13-15', elapsedMin: 5, turnNumber: 5 }));
    expect(text).toContain('13-15');
    expect(text).toContain('проста лексика');
    expect(text).toContain('Згадай фахівця на 10-й хвилині');
  });

  // SN-08: 16-17 — базовий контекст без age-специфічних правил
  it('SN-08 · ageBand 16-17 — age_band:16-17 у контексті, без правила 13-15', () => {
    const text = systemText(makeCtx({ ageBand: '16-17' }));
    expect(text).toContain('16-17');
    expect(text).not.toContain('проста лексика');
  });

  // SN-09: 18-25 — дорослий діапазон
  it('SN-09 · ageBand 18-25 — age_band:18-25 у контексті, без правила 13-15', () => {
    const text = systemText(makeCtx({ ageBand: '18-25' }));
    expect(text).toContain('18-25');
    expect(text).not.toContain('проста лексика');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Time-фази (elapsedMin)
// ─────────────────────────────────────────────────────────────────────────────

describe('prompt-snapshot · time-фази', () => {
  // SN-10: elapsedMin=0 — початок сесії, без завершальних правил
  it('SN-10 · elapsedMin=0 — без завершальних правил', () => {
    const text = systemText(makeCtx({ elapsedMin: 0, turnNumber: 5 }));
    expect(text).not.toContain('плавне завершення');
    expect(text).not.toContain('Час вийшов');
    // Базовий elapsed присутній у контексті
    expect(text).toContain('elapsed:');
    expect(text).toContain('0 / 25 хв');
  });

  // SN-11: elapsedMin=45 + turnNumber>3 — "Час вийшов" (≥25 хв активно)
  it('SN-11 · elapsedMin=45 + turnNumber=5 — «Час вийшов» у turn rules', () => {
    const text = systemText(makeCtx({ elapsedMin: 45, turnNumber: 5 }));
    expect(text).toContain('Час вийшов');
    expect(text).toContain('45 / 25 хв');
  });

  // SN-12: elapsedMin=23 + turnNumber>3 — плавне завершення
  it('SN-12 · elapsedMin=23 + turnNumber=5 — «плавне завершення»', () => {
    const text = systemText(makeCtx({ elapsedMin: 23, turnNumber: 5 }));
    expect(text).toContain('плавне завершення');
    expect(text).not.toContain('Час вийшов');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Стабільність структури блоків (кількість)
// ─────────────────────────────────────────────────────────────────────────────

describe('prompt-snapshot · block count stability', () => {
  it('none — рівно 6 базових блоків', () => {
    expect(blockCount(makeCtx({ crisisLevel: 'none' }))).toBe(6);
  });

  it('elevated — 7 блоків (base+1)', () => {
    expect(blockCount(makeCtx({ crisisLevel: 'elevated' }))).toBe(7);
  });

  it('high — 7 блоків (base+1)', () => {
    expect(blockCount(makeCtx({ crisisLevel: 'high' }))).toBe(7);
  });

  it('imminent — 7 блоків (base+1)', () => {
    expect(blockCount(makeCtx({ crisisLevel: 'imminent' }))).toBe(7);
  });

  it('postCrisis — 7 блоків (base+1)', () => {
    expect(blockCount(makeCtx({ crisisLevel: 'none', postCrisisMode: true }))).toBe(7);
  });

  it('high+postCrisis — 8 блоків (base+2)', () => {
    expect(blockCount(makeCtx({ crisisLevel: 'high', postCrisisMode: true }))).toBe(8);
  });
});
