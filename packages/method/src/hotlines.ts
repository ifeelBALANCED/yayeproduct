import type { Hotline } from './types';

export const HOTLINES: Record<string, readonly Hotline[]> = {
  UA: [
    { name: 'Дитяча лінія довіри', number: '116 111', note: 'безкоштовно · цілодобово' },
    { name: 'Teenergizer', number: '7333', note: 'чат · для підлітків' },
  ],
  US: [{ name: '988 Suicide & Crisis Lifeline', number: '988', note: 'call · text' }],
  UK: [{ name: 'Samaritans', number: '116 123', note: '24/7' }],
  EU: [{ name: 'Samaritans', number: '116 123', note: '24/7' }],
} as const;

export function getHotlines(jurisdiction: string): readonly Hotline[] {
  return HOTLINES[jurisdiction] ?? HOTLINES['UA']!;
}
