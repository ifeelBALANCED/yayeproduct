// parseModeLabel.test.ts — unit-тести для parseModeLabel / stripModeLabel.
// S3: «mode-лейбл з відповіді» — парсер витягує лейбл з тексту AI.

import { describe, it, expect } from 'vitest';
import { parseModeLabel, stripModeLabel, DEFAULT_MODE_LABEL } from '../parseModeLabel';

describe('parseModeLabel', () => {
  it('витягує [01 · ПІДТРИМУЮ] з початку відповіді', () => {
    const text = '[01 · ПІДТРИМУЮ]\nіспит завтра.';
    expect(parseModeLabel(text)).toBe('[01 · підтримую]');
  });

  it('витягує [02 · ПОРУЧ]', () => {
    const text = '[02 · ПОРУЧ]   де ти зараз?';
    expect(parseModeLabel(text)).toBe('[02 · поруч]');
  });

  it('витягує [03 · ОБЕРЕЖНО]', () => {
    const text = '[03 · ОБЕРЕЖНО]\nя чую тебе.';
    expect(parseModeLabel(text)).toBe('[03 · обережно]');
  });

  it('витягує [04 · ПАУЗА]', () => {
    const text = '[04 · ПАУЗА] що відбувається?';
    expect(parseModeLabel(text)).toBe('[04 · пауза]');
  });

  it('фолбек на DEFAULT_MODE_LABEL якщо тег відсутній', () => {
    const text = 'я тут. як ти зараз?';
    expect(parseModeLabel(text)).toBe(DEFAULT_MODE_LABEL);
  });

  it('фолбек на DEFAULT_MODE_LABEL для порожнього рядка', () => {
    expect(parseModeLabel('')).toBe(DEFAULT_MODE_LABEL);
  });

  it('фолбек якщо тег не на початку', () => {
    const text = 'деякий текст [01 · ПІДТРИМУЮ] ще текст';
    expect(parseModeLabel(text)).toBe(DEFAULT_MODE_LABEL);
  });

  it('ігнорує відступи перед тегом (trimStart)', () => {
    const text = '   [02 · ПОРУЧ]\nтекст';
    expect(parseModeLabel(text)).toBe('[02 · поруч]');
  });

  it('результат завжди в нижньому регістрі', () => {
    const text = '[01 · ПІДТРИМУЮ]';
    const result = parseModeLabel(text);
    expect(result).toBe(result.toLowerCase());
  });
});

describe('stripModeLabel', () => {
  it('видаляє тег з початку', () => {
    const text = '[01 · ПІДТРИМУЮ]\nіспит завтра.';
    expect(stripModeLabel(text)).toBe('іспит завтра.');
  });

  it('видаляє тег з пробілами після нього', () => {
    const text = '[02 · ПОРУЧ]   де ти?';
    expect(stripModeLabel(text)).toBe('де ти?');
  });

  it('не змінює текст без тегу', () => {
    const text = 'я тут.';
    expect(stripModeLabel(text)).toBe('я тут.');
  });

  it('не видаляє тег не з початку', () => {
    const text = 'текст [01 · ПІДТРИМУЮ] ще';
    expect(stripModeLabel(text)).toBe('текст [01 · ПІДТРИМУЮ] ще');
  });
});
