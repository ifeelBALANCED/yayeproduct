import { defineConfig, devices } from '@playwright/test';

// playwright.config.ts — S3 E2E-харнес (quality-gate §3 S3).
// Два проєкти:
//   'e2e'    — флоу-тести (e2e/**/*.spec.ts, крім e2e/visual/**)
//   'visual' — регресія скріншотів (e2e/visual/**) — заготовка, viewport-матриця додається в S4.
//
// webServer: pnpm start (production build).
// У CI перед цим виконується: pnpm --filter @ya-ye/teen build
// reuseExistingServer: true локально (щоб не перебудовувати при розробці тестів),
//                      false у CI (process.env.CI встановлено).

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'e2e',
      testDir: './e2e',
      // testIgnore, не lookahead-testMatch: незаякорений (?!visual/) матчиться
      // з будь-якої позиції шляху і НЕ виключає e2e/visual/**.
      testIgnore: /e2e\/visual\//,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      // Заготовка для S4 — viewport-матриця (375/768/1280) і reducedMotion
      // додає агент S4 (visual regression). Тут — мінімальна заготовка:
      // locale 'uk-UA' і reducedMotion 'reduce' будуть додані через
      // contextOptions при реалізації S4.
      name: 'visual',
      testMatch: '**/e2e/visual/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'uk-UA',
      },
    },
  ],

  webServer: {
    command: 'pnpm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
