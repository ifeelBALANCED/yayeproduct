// Lighthouse CI конфіг — quality-gate §3 S7
// Вимога: perf >= 0.90, a11y = 1.00
//
// PWA-категорія (Lighthouse 12) тут не перевіряється:
// PWA-аудит (SW не кешує /api/* і SSE) покривається окремим
// Playwright-тестом відповідно до docs/quality-gate.md §3 S7.
//
// collect.settings.preset = 'desktop': детермінізм на CI-раннері;
// mobile-throttling (DevTools emulation) шумить у хмарних VM.

'use strict';

module.exports = {
  ci: {
    collect: {
      // pnpm start запускає вже зібраний production-білд
      startServerCommand: 'pnpm start',
      url: ['http://localhost:3000/', 'http://localhost:3000/specialists'],
      numberOfRuns: 3,
      settings: {
        // desktop — стабільні скори на CI без network throttling
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // aggregationMethod 'pessimistic': всі 3 прогони мають пройти поріг.
        // Дефолт LHCI — 'optimistic' (Math.max по прогонах) — пропускає
        // 2/3 червоних прогонів, що робить gate фікцією.
        // docs/quality-gate.md §3 S7: perf >= 90
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'pessimistic' }],
        // docs/quality-gate.md §3 S7: a11y = 100
        'categories:accessibility': ['error', { minScore: 1, aggregationMethod: 'pessimistic' }],
      },
    },
    upload: {
      // Звіти зберігаються локально; .lighthouseci/ у .gitignore
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
