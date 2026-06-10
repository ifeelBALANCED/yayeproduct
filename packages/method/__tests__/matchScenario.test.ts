import { describe, it, expect } from 'vitest';
import { matchScenario, matchAllScenarios } from '../src/matchScenario';
import { SCENARIOS } from '../src/scenarios';

describe('matchScenario — FM1 scenarios', () => {
  // ── fm1-no-space ──────────────────────────────────────────────────────────

  it('тригериться на «зайвий»', () => {
    const result = matchScenario('я відчуваю що я зайвий тут');
    expect(result?.id).toBe('fm1-no-space');
  });

  it('тригериться на «зайва» (жіночий рід)', () => {
    const result = matchScenario('вдома я завжди зайва');
    expect(result?.id).toBe('fm1-no-space');
  });

  it('тригериться на «не вписуюся»', () => {
    const result = matchScenario('я не вписуюся в цю компанію');
    expect(result?.id).toBe('fm1-no-space');
  });

  it('тригериться на «нікому не потрібен»', () => {
    const result = matchScenario('нікому не потрібен вже давно');
    expect(result?.id).toBe('fm1-no-space');
  });

  // ── fm1-freeze ────────────────────────────────────────────────────────────

  it('тригериться на «завмер»', () => {
    const result = matchScenario('я просто завмер і не можу нічого робити');
    expect(result?.id).toBe('fm1-freeze');
  });

  it('тригериться на «порожньо всередині»', () => {
    const result = matchScenario('порожньо всередині вже кілька днів');
    expect(result?.id).toBe('fm1-freeze');
  });

  it('тригериться на «нічого не відчуваю»', () => {
    const result = matchScenario('нічого не відчуваю взагалі');
    expect(result?.id).toBe('fm1-freeze');
  });

  it('тригериться на «не маю сил»', () => {
    const result = matchScenario('просто не маю сил на це все');
    expect(result?.id).toBe('fm1-freeze');
  });

  // ── fm1-self-trust ────────────────────────────────────────────────────────

  it('тригериться на «провалюся»', () => {
    const result = matchScenario('я точно провалюся на іспиті');
    expect(result?.id).toBe('fm1-self-trust');
  });

  it('тригериться на «не вірю в себе»', () => {
    const result = matchScenario('не вірю в себе взагалі');
    expect(result?.id).toBe('fm1-self-trust');
  });

  it('тригериться на «страшно спробувати»', () => {
    const result = matchScenario('страшно спробувати — раптом не вийде');
    expect(result?.id).toBe('fm1-self-trust');
  });

  it('тригериться на «невпевненість у собі»', () => {
    const result = matchScenario('маю таку велику невпевненість у собі');
    expect(result?.id).toBe('fm1-self-trust');
  });

  // ── Загальна якість ───────────────────────────────────────────────────────

  it('повертає null для нейтрального тексту', () => {
    const result = matchScenario('привіт як справи сьогодні');
    expect(result).toBeNull();
  });

  it('регістр не має значення', () => {
    const result = matchScenario('Я Завмер і не можу рухатися');
    expect(result?.id).toBe('fm1-freeze');
  });

  it('matchAllScenarios повертає масив', () => {
    const results = matchAllScenarios('зайвий і порожньо всередині');
    const ids = results.map((s) => s.id);
    expect(ids).toContain('fm1-no-space');
    expect(ids).toContain('fm1-freeze');
  });

  // ── FM2 · «Я маю право жити» ─────────────────────────────────────────────

  it('fm2-no-joy тригериться на «нічого не радує»', () => {
    const result = matchScenario('нічого не радує вже давно');
    expect(result?.id).toBe('fm2-no-joy');
  });

  it('fm2-no-joy тригериться на «все сіре»', () => {
    const result = matchScenario('все сіре і нецікаво');
    expect(result?.id).toBe('fm2-no-joy');
  });

  it('fm2-no-joy тригериться на «байдуже до всього»', () => {
    const result = matchScenario('байдуже до всього що відбувається');
    expect(result?.id).toBe('fm2-no-joy');
  });

  it('fm2-loss тригериться на «не можу відпустити»', () => {
    const result = matchScenario('не можу відпустити його вже місяць');
    expect(result?.id).toBe('fm2-loss');
  });

  it('fm2-loss тригериться на «досі болить»', () => {
    const result = matchScenario('досі болить після того що сталося');
    expect(result?.id).toBe('fm2-loss');
  });

  it('fm2-loss тригериться на «живу минулим»', () => {
    const result = matchScenario('відчуваю що живу минулим весь час');
    expect(result?.id).toBe('fm2-loss');
  });

  it('fm2-loss тригериться на «не можу рухатися далі»', () => {
    const result = matchScenario('просто не можу рухатися далі після цього');
    expect(result?.id).toBe('fm2-loss');
  });

  it('жоден openingPrompt ФМ2 не містить «терапія»', () => {
    for (const s of SCENARIOS.filter((s) => s.fm === 2)) {
      expect(s.openingPrompt).not.toMatch(/терапі/i);
    }
  });

  // ── FM3 · «Я є я» ────────────────────────────────────────────────────────

  it('fm3-no-self тригериться на «загубив себе»', () => {
    const result = matchScenario('загубив себе десь по дорозі');
    expect(result?.id).toBe('fm3-no-self');
  });

  it('fm3-no-self тригериться на «загубила себе» (жіночий рід)', () => {
    const result = matchScenario('я загубила себе в цих стосунках');
    expect(result?.id).toBe('fm3-no-self');
  });

  it('fm3-no-self тригериться на «живу не своїм життям»', () => {
    const result = matchScenario('відчуваю що живу не своїм життям');
    expect(result?.id).toBe('fm3-no-self');
  });

  it('fm3-no-self тригериться на «не впізнаю себе»', () => {
    const result = matchScenario('не впізнаю себе вже давно');
    expect(result?.id).toBe('fm3-no-self');
  });

  it('fm3-boundary тригериться на «зрадив себе»', () => {
    const result = matchScenario('знову зрадив себе і погодився');
    expect(result?.id).toBe('fm3-boundary');
  });

  it('fm3-boundary тригериться на «зрадила себе» (жіночий рід)', () => {
    const result = matchScenario('зрадила себе коли не сказала ні');
    expect(result?.id).toBe('fm3-boundary');
  });

  it('fm3-boundary тригериться на «не можу відмовити»', () => {
    const result = matchScenario('просто не можу відмовити їм ніколи');
    expect(result?.id).toBe('fm3-boundary');
  });

  it('fm3-boundary тригериться на «відчуваю провину коли відмовляю»', () => {
    const result = matchScenario('завжди відчуваю провину коли відмовляю');
    expect(result?.id).toBe('fm3-boundary');
  });

  it('fm3 fm поле дорівнює 3', () => {
    for (const s of SCENARIOS.filter((s) => s.id.startsWith('fm3'))) {
      expect(s.fm).toBe(3);
    }
  });

  // ── Wellness-мова: заборонені слова ──────────────────────────────────────

  it('жоден openingPrompt не містить «симптом»', () => {
    for (const s of SCENARIOS) {
      expect(s.openingPrompt).not.toMatch(/симптом/i);
    }
  });

  it('жоден openingPrompt не містить «розлад»', () => {
    for (const s of SCENARIOS) {
      expect(s.openingPrompt).not.toMatch(/розлад/i);
    }
  });

  it('жоден openingPrompt не містить «діагноз»', () => {
    for (const s of SCENARIOS) {
      expect(s.openingPrompt).not.toMatch(/діагноз/i);
    }
  });

  it('жоден openingPrompt не містить «терапія»', () => {
    for (const s of SCENARIOS) {
      expect(s.openingPrompt).not.toMatch(/терапі/i);
    }
  });
});
