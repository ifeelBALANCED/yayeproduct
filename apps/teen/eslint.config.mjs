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
          selector: 'JSXText',
          message: 'Emoji у JSX-тексті заборонені дизайн-системою «Я Є».',
        },
      ],
    },
  },
];

export default eslintConfig;
