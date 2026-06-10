import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Заборонити emoji у JSX-тексті — клінічна вимога
      'no-restricted-syntax': [
        'error',
        {
          // Матчимо лише emoji-символи (BMP-блоки + сурогатні пари astral-планів),
          // а не будь-який JSXText. \uD83C-\uD83E — high surrogates U+1F000–U+1FAFF.
          selector:
            'JSXText[value=/[\\u203C\\u2049\\u20E3\\u2600-\\u27BF\\u2B00-\\u2BFF\\uFE0F\\uD83C-\\uD83E]/]',
          message: 'Emoji у JSX-тексті заборонені дизайн-системою «Я Є».',
        },
      ],
    },
  },
];

export default eslintConfig;
