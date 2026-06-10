import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['**/*.ts'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.config.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // 100% branches для safety-core файлів
        'crisis-detector.ts': {
          branches: 100,
        },
        'system-prompt.ts': {
          branches: 100,
        },
      },
    },
  },
});
