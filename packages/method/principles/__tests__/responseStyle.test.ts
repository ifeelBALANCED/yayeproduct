/**
 * responseStyle.test.ts — unit-тести для validateResponseStyle (S6 gate).
 * Перевірка на SSE-фікстурах (рядки відповідей AI).
 */
import { describe, it, expect } from 'vitest';
import { validateResponseStyle } from '../responseStyle';

// ─────────────────────────────────────────────────────────────────────────────
// Фікстури SSE-відповідей (симульовані рядки з Anthropic stream)
// ─────────────────────────────────────────────────────────────────────────────

describe('validateResponseStyle · дозволені відповіді', () => {
  const ALLOWED: Array<{ label: string; text: string }> = [
    {
      label: 'коротка присутність — 1 бабл',
      text: 'я тут.',
    },
    {
      label: '2 баббли — стандарт',
      text: 'звучить важко.\n\nщо сталося?',
    },
    {
      label: '3 баббли — максимально насичена відповідь',
      text: 'стоп. зупинись на секунду.\n\nя тут.\n\nщо зараз відбувається — всередині?',
    },
    {
      label: '4 баббли — максимум',
      text: 'ясно.\n\nце звучить виснажливо.\n\nрозкажи що саме найбільше тисне?\n\nя слухаю.',
    },
    {
      label: 'crisis-відповідь без emoji і малими',
      text: 'стоп. зупинись на секунду.\n\nя хочу щоб ти зараз був не сам з цим.',
    },
    {
      label: 'відповідь тільки крапка (мовчазна пауза)',
      text: '.',
    },
    {
      label: 'нейтральна з цитатою юзера',
      text: '«мені важко» — давно так?',
    },
    {
      label: 'постійна доступність — дозволена форма (не «завжди»)',
      text: 'я тут, якщо повернешся.',
    },
  ];

  for (const { label, text } of ALLOWED) {
    it(`дозволено: ${label}`, () => {
      const result = validateResponseStyle(text);
      expect(result.valid, JSON.stringify(result.violations)).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  }
});

describe('validateResponseStyle · порушення — emoji', () => {
  const EMOJI_VIOLATIONS: Array<{ label: string; text: string }> = [
    { label: 'смайлик обличчя', text: 'я тут 😊' },
    { label: 'серце', text: 'тримайся ❤️' },
    { label: 'вогонь', text: 'це 🔥 важливо' },
    { label: 'галочка', text: '✅ зроблено' },
  ];

  for (const { label, text } of EMOJI_VIOLATIONS) {
    it(`emoji → invalid: ${label}`, () => {
      const result = validateResponseStyle(text);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.rule === 'no-emoji')).toBe(true);
    });
  }
});

describe('validateResponseStyle · порушення — велика літера на початку', () => {
  const UPPERCASE_VIOLATIONS = [
    'Як ти зараз?',
    'Звучить важко.',
    'Ясно, розкажи більше.',
    'Розумію тебе.',
  ];

  for (const text of UPPERCASE_VIOLATIONS) {
    it(`uppercase-start → invalid: "${text}"`, () => {
      const result = validateResponseStyle(text);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.rule === 'lowercase-start')).toBe(true);
    });
  }

  it('число на початку — не порушення (не буква)', () => {
    const result = validateResponseStyle('116 111 — лінія довіри');
    expect(result.violations.some((v) => v.rule === 'lowercase-start')).toBe(false);
  });
});

describe('validateResponseStyle · порушення — заборонені фрази (CLAUDE.md §4)', () => {
  const FORBIDDEN: Array<{ label: string; text: string }> = [
    {
      label: 'симуляція взаємності — думала',
      text: 'я думала про тебе весь день.',
    },
    {
      label: 'симуляція взаємності — думав',
      text: 'я думав про тебе.',
    },
    {
      label: 'сумую за тобою',
      text: 'я сумую за тобою.',
    },
    {
      label: 'бракувало',
      text: 'мені тебе бракувало.',
    },
    {
      label: 'скучила',
      text: 'я скучила.',
    },
    {
      label: 'скучив',
      text: 'я скучив за тобою.',
    },
    {
      label: 'медичний діагноз — депресія',
      text: 'можливо, у тебе депресія.',
    },
    {
      label: 'шаблон — дякую що поділився',
      text: 'дякую що поділився зі мною.',
    },
    {
      label: 'шаблон — дякую що поділилась',
      text: 'дякую що поділилась.',
    },
    {
      label: 'шаблон — розумію як тобі важко',
      text: 'я розумію як тобі важко.',
    },
    {
      label: 'шаблон — це дуже сміливо',
      text: 'це дуже сміливо з твого боку.',
    },
    {
      label: 'шаблон — все буде добре',
      text: 'все буде добре, не хвилюйся.',
    },
    {
      label: 'шаблон — ти не один',
      text: 'ти не один в цьому.',
    },
    {
      label: 'шаблон — ти не одна',
      text: 'ти не одна.',
    },
  ];

  for (const { label, text } of FORBIDDEN) {
    it(`forbidden-phrase → invalid: ${label}`, () => {
      const result = validateResponseStyle(text);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.rule === 'forbidden-phrase')).toBe(true);
    });
  }
});

describe('validateResponseStyle · порушення — більше 4 бабблів', () => {
  it('5 бабблів → invalid', () => {
    const text = 'бабл 1\n\nбабл 2\n\nбабл 3\n\nбабл 4\n\nбабл 5';
    const result = validateResponseStyle(text);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.rule === 'max-4-bubbles')).toBe(true);
  });

  it('6 бабблів → invalid', () => {
    const text = ['а', 'б', 'в', 'г', 'ґ', 'д'].join('\n\n');
    const result = validateResponseStyle(text);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.rule === 'max-4-bubbles')).toBe(true);
  });

  it('4 баббли → valid', () => {
    const text = ['один.', 'два.', 'три.', 'чотири.'].join('\n\n');
    const result = validateResponseStyle(text);
    expect(result.violations.some((v) => v.rule === 'max-4-bubbles')).toBe(false);
  });

  it('порожні рядки між бабблями не рахуються як окремі баббли', () => {
    // "\n\n\n" між бабблями = один розділювач
    const text = 'перший.\n\n\n\nдругий.';
    const result = validateResponseStyle(text);
    expect(result.violations.some((v) => v.rule === 'max-4-bubbles')).toBe(false);
  });
});

describe('validateResponseStyle · множинні порушення', () => {
  it('emoji + велика + заборонена фраза — всі три violation', () => {
    const text = 'Я думала про тебе 😊';
    const result = validateResponseStyle(text);
    expect(result.valid).toBe(false);
    const rules = result.violations.map((v) => v.rule);
    expect(rules).toContain('no-emoji');
    expect(rules).toContain('lowercase-start');
    expect(rules).toContain('forbidden-phrase');
  });
});
