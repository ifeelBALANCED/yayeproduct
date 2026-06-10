import { describe, it, expect } from 'vitest';
import { detectCrisis } from '../crisis-detector';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.join(__dirname, '../../../docs/crisis-test-corpus-mvp.jsonl');
const corpus = fs
  .readFileSync(corpusPath, 'utf-8')
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line) as { id: number; text: string; expected: string; notes: string });

describe('crisis-detector · per-case', () => {
  for (const c of corpus) {
    it(`case ${c.id}: "${c.text.slice(0, 50)}..."`, () => {
      const result = detectCrisis(c.text);
      expect(result.severity).toBe(c.expected);
    });
  }
});

describe('crisis-detector · aggregate recall', () => {
  it('recall on severity >= high must be >= 90%', () => {
    const highOrAbove = corpus.filter((c) => c.expected === 'high' || c.expected === 'imminent');
    const caught = highOrAbove.filter((c) => {
      const result = detectCrisis(c.text);
      return result.severity === c.expected || result.severity === 'imminent';
    });
    const recall = caught.length / highOrAbove.length;
    expect(recall).toBeGreaterThanOrEqual(0.9);
  });
});
