// apps/teen/vitest.config.ts — конфіг для unit + integration тестів.
// S1: src/**/*.test.ts — без HTTP, без живої БД (quality-gate §S1).
// S2: __tests__/**/*.test.ts — env-gated, проти supabase local (quality-gate §S2).
// Без dependsOn ^build (P0-6: unit-тести не чекають збірки).
//
// Caveat: coverage-пороги не задані для integration-файлів — борг Phase 2.
// Пороги 80% діють лише для src/server/ (S1-unit scope).

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // '@/*' → './src/*' — відповідає tsconfig.json paths
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // S1 unit-тести + S2 integration-тести (integration скипаються без env)
    include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/server/**/*.ts'],
      exclude: ['**/*.test.ts'],
      // Caveat (борг): coverage-пороги не enforced у Phase 2 —
      // integration-тести потребують живої БД і не підпадають під coverage.
      // Пороги буде включено у Phase 3 після стабілізації S2.
    },
  },
});
