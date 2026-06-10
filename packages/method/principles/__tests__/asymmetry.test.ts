import { describe, it, expect } from 'vitest';
import { validateAsymmetry } from '../asymmetry';

describe('validateAsymmetry · violations (мають бути catched)', () => {
  const VIOLATIONS = [
    'я думала про тебе цілий день',
    'мені тебе бракувало',
    'я скучила',
    'я тебе чекатиму',
    'я тут завжди',
    'я завжди буду поруч',
    'ми з тобою друзі',
    'тільки я тебе розумію',
    'давай продовжимо звідки зупинились',
    'мені приємно з тобою говорити',
  ];

  for (const v of VIOLATIONS) {
    it(`catches: "${v}"`, () => {
      expect(validateAsymmetry(v).valid).toBe(false);
    });
  }
});

describe('validateAsymmetry · allowed (мають ПРОХОДИТИ)', () => {
  const ALLOWED = [
    'я тут, якщо повернешся',
    'можеш повернутись завтра — я буду доступний',
    'якщо знадобиться поговорити ще раз — я доступний',
    'я буду доступна — так. це продукт, який працює щодня',
    'у цій розмові — я уважна',
    'привіт.',
    'розкажи, як зараз?',
    'я тут.',
  ];

  for (const a of ALLOWED) {
    it(`allows: "${a}"`, () => {
      expect(validateAsymmetry(a).valid).toBe(true);
    });
  }
});
