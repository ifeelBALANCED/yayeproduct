import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// Правила дизайн-системи «Я Є» — спільні для всіх файлів
const DESIGN_TOKEN_RULES_COMMON = [
  {
    // Emoji у JSX-тексті — клінічна вимога
    selector:
      'JSXText[value=/[\\u203C\\u2049\\u20E3\\u2600-\\u27BF\\u2B00-\\u2BFF\\uFE0F\\uD83C-\\uD83E]/]',
    message: 'Emoji у JSX-тексті заборонені дизайн-системою «Я Є».',
  },
  {
    // Заборона тіней поза shadow-sm у рядкових літералах
    selector: 'Literal[value=/shadow-(md|lg|xl|2xl)/]',
    message: 'тільки shadow-sm (дизайн-система «Я Є»).',
  },
  {
    // Заборона тіней поза shadow-sm у шаблонних рядках
    selector: 'TemplateElement[value.raw=/shadow-(md|lg|xl|2xl)/]',
    message: 'тільки shadow-sm (дизайн-система «Я Є»).',
  },
];

// Додаткові правила тільки для .tsx — заборона hex у className
const DESIGN_TOKEN_RULES_TSX = [
  ...DESIGN_TOKEN_RULES_COMMON,
  {
    // Hex-кольори у className рядках — використовуй токени tailwind
    selector: 'JSXAttribute[name.name="className"] Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
    message:
      'Hex-кольори у className заборонені — використовуй токени tailwind (bg-bg, text-ink, тощо) (дизайн-система «Я Є»).',
  },
  {
    selector:
      'JSXAttribute[name.name="className"] TemplateLiteral TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]',
    message:
      'Hex-кольори у className заборонені — використовуй токени tailwind (дизайн-система «Я Є»).',
  },
];

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // Базові правила для всіх файлів (не tsx)
  {
    ignores: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...DESIGN_TOKEN_RULES_COMMON],
    },
  },
  // Розширені правила для .tsx (включно з hex-кольорами у className)
  {
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...DESIGN_TOKEN_RULES_TSX],
    },
  },
];

export default eslintConfig;
