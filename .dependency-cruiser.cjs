// dependency-cruiser — перевірка меж залежностей (S0, docs/quality-gate.md §2.2)
// Нові порушення правил class "error" блокують CI.
// Існуючий борг (§2.3) позначено severity "warn" з коментарем.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ─── Циклічні залежності — завжди помилка ───────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Циклічні залежності заборонені (§2.2)',
      from: {},
      to: {
        circular: true,
      },
    },

    // ─── apps не імпортують одне одного ─────────────────────────────────────
    {
      name: 'no-cross-app-imports',
      severity: 'error',
      comment: 'apps/* не повинні імпортувати інші apps/* (§2.2)',
      from: {
        path: '^apps/([^/]+)/',
      },
      to: {
        path: '^apps/',
        pathNot: '^apps/$1/',
      },
    },

    // ─── packages не імпортують apps ────────────────────────────────────────
    {
      name: 'no-package-imports-app',
      severity: 'error',
      comment: 'packages/* не повинні імпортувати apps/* (§2.2)',
      from: {
        path: '^packages/',
      },
      to: {
        path: '^apps/',
      },
    },

    // ─── packages/method не імпортує @supabase/* ────────────────────────────
    {
      name: 'method-no-supabase',
      severity: 'error',
      comment: 'packages/method — чистий TS, без @supabase/* (§2.2)',
      from: {
        path: '^packages/method/',
      },
      to: {
        dependencyTypes: ['npm'],
        path: '@supabase',
      },
    },

    // ─── packages/method не імпортує next ───────────────────────────────────
    {
      name: 'method-no-next',
      severity: 'error',
      comment: 'packages/method — чистий TS, без next (§2.2)',
      from: {
        path: '^packages/method/',
      },
      to: {
        dependencyTypes: ['npm'],
        path: '^next(/|$)',
      },
    },

    // ─── packages/ui не імпортує @supabase/*, packages/db, packages/method ──
    {
      name: 'ui-no-supabase',
      severity: 'error',
      comment: 'packages/ui не повинен залежати від @supabase/* (§2.2)',
      from: {
        path: '^packages/ui/',
      },
      to: {
        dependencyTypes: ['npm'],
        path: '@supabase',
      },
    },
    {
      name: 'ui-no-db',
      severity: 'error',
      comment: 'packages/ui не повинен залежати від packages/db (§2.2)',
      from: {
        path: '^packages/ui/',
      },
      to: {
        path: '^packages/db/',
      },
    },
    {
      name: 'ui-no-method',
      severity: 'error',
      comment: 'packages/ui не повинен залежати від packages/method (§2.2)',
      from: {
        path: '^packages/ui/',
      },
      to: {
        path: '^packages/method/',
      },
    },

    // ─── packages/db не імпортує react або next ─────────────────────────────
    {
      name: 'db-no-react',
      severity: 'error',
      comment: 'packages/db — без react (§2.2)',
      from: {
        path: '^packages/db/',
      },
      to: {
        dependencyTypes: ['npm'],
        path: '^react(/|$)',
      },
    },
    {
      name: 'db-no-next',
      severity: 'error',
      comment: 'packages/db — без next (§2.2)',
      from: {
        path: '^packages/db/',
      },
      to: {
        dependencyTypes: ['npm'],
        path: '^next(/|$)',
      },
    },

    // ─── apps/*/src/components — без прямих імпортів @supabase/* ────────────
    // Дозволено тільки через lib/ або server/
    {
      name: 'components-no-direct-supabase',
      severity: 'error',
      comment:
        'Компоненти не можуть прямо імпортувати @supabase/*; тільки через lib/ або server/ (§2.2)',
      from: {
        path: '^apps/[^/]+/src/components/',
      },
      to: {
        dependencyTypes: ['npm'],
        path: '@supabase',
      },
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules|[.]next|dist|coverage',
    },
    exclude: {
      path: 'node_modules|[.]next|dist|coverage',
    },
    moduleSystems: ['es6', 'cjs'],
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.base.json',
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
