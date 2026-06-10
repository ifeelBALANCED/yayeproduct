// S5 security headers test (quality-gate §S5).
// Перевіряє що всі три next.config.mjs оголошують обов'язкові security headers
// на маршруті '/(.*)', без необхідності живого HTTP-сервера.
//
// Тест імпортує nextConfig.headers() напряму і перевіряє наявність 6 хедерів.

import { describe, it, expect } from 'vitest';

// next.config.mjs — ESM-файли; vitest з environment:'node' підтримує dynamic import.
// Оскільки файли використовують process.env.NODE_ENV, встановлюємо його до імпорту.

// Список обов'язкових security-хедерів (quality-gate §S5).
const REQUIRED_HEADERS = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
];

// Витягуємо всі headers з конфігу для маршруту '/(.*)'
async function extractHeaders(configPath: string): Promise<Array<{ key: string; value: string }>> {
  // Динамічний імпорт ESM конфігу
  const mod = await import(configPath);
  // Next.js конфіг може бути default export або об'єктом
  // Підтримуємо обидва варіанти: withPWA обгортає конфіг, повертаючи функцію або об'єкт
  const config: unknown = mod.default ?? mod;

  // Конфіг може бути функцією (коли обгорнуто withPWA/withNextIntl)
  // або об'єктом з headers().
  let resolvedConfig: unknown = config;
  if (typeof resolvedConfig === 'function') {
    // Викликаємо з мінімальними фіктивними фазами/defaultConfig
    resolvedConfig = await (resolvedConfig as (phase: string, opts: unknown) => unknown)(
      'phase-production-build',
      { defaultConfig: {} },
    );
  }

  const cfg = resolvedConfig as {
    headers?: () => Promise<
      Array<{ source: string; headers: Array<{ key: string; value: string }> }>
    >;
  };

  if (typeof cfg.headers !== 'function') {
    throw new Error(`headers() не знайдено у конфізі ${configPath}`);
  }

  const entries = await cfg.headers();

  // Шукаємо catch-all маршрут '/(.*)'
  const catchAll = entries.find((e) => e.source === '/(.*)');
  if (!catchAll) {
    throw new Error(
      `Маршрут '/(.*)'  не знайдено у конфізі ${configPath}. Знайдено: ${entries.map((e) => e.source).join(', ')}`,
    );
  }

  return catchAll.headers;
}

describe('security headers — apps/teen/next.config.mjs', () => {
  const configPath = new URL('../../../../apps/teen/next.config.mjs', import.meta.url).pathname;

  it('оголошує всі 6 обовязкових security headers', async () => {
    const headers = await extractHeaders(configPath);
    const keys = headers.map((h) => h.key);

    for (const required of REQUIRED_HEADERS) {
      expect(keys, `Відсутній хедер: ${required}`).toContain(required);
    }
  });

  it('CSP не містить unsafe-eval у production', async () => {
    const originalEnv = process.env.NODE_ENV;
    // Виставляємо production перед імпортом (module-level змінна isDev вже обчислена)
    // Тому перевіряємо що хедер присутній; unsafe-eval — лише в dev-гілці коду.
    const headers = await extractHeaders(configPath);
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    // У production-збірці unsafe-eval відсутній.
    // Оскільки isDev = process.env.NODE_ENV === 'development' вирахувано при завантаженні модуля,
    // і в тестовому середовищі NODE_ENV зазвичай 'test' — перевіряємо що CSP непорожній.
    expect(csp.length).toBeGreaterThan(0);
    expect(csp).toContain("default-src 'self'");
    // Тест-середовище не є development → unsafe-eval не має бути
    if (originalEnv !== 'development') {
      expect(csp).not.toContain("'unsafe-eval'");
    }
  });

  it('HSTS має правильне значення', async () => {
    const headers = await extractHeaders(configPath);
    const hsts = headers.find((h) => h.key === 'Strict-Transport-Security')?.value ?? '';
    expect(hsts).toContain('max-age=63072000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('X-Frame-Options = DENY', async () => {
    const headers = await extractHeaders(configPath);
    const xfo = headers.find((h) => h.key === 'X-Frame-Options')?.value ?? '';
    expect(xfo).toBe('DENY');
  });

  it('Permissions-Policy забороняє camera, microphone, geolocation', async () => {
    const headers = await extractHeaders(configPath);
    const pp = headers.find((h) => h.key === 'Permissions-Policy')?.value ?? '';
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
  });
});

describe('security headers — apps/therapists/next.config.mjs', () => {
  const configPath = new URL('../../../../apps/therapists/next.config.mjs', import.meta.url)
    .pathname;

  it('оголошує всі 6 обовязкових security headers', async () => {
    const headers = await extractHeaders(configPath);
    const keys = headers.map((h) => h.key);

    for (const required of REQUIRED_HEADERS) {
      expect(keys, `Відсутній хедер: ${required}`).toContain(required);
    }
  });

  it('CSP містить connect-src з supabase', async () => {
    const headers = await extractHeaders(configPath);
    const csp = headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toContain('connect-src');
    expect(csp).toContain('supabase.co');
  });
});

describe('security headers — apps/landing/next.config.mjs', () => {
  const configPath = new URL('../../../../apps/landing/next.config.mjs', import.meta.url).pathname;

  it('оголошує всі 6 обовязкових security headers', async () => {
    const headers = await extractHeaders(configPath);
    const keys = headers.map((h) => h.key);

    for (const required of REQUIRED_HEADERS) {
      expect(keys, `Відсутній хедер: ${required}`).toContain(required);
    }
  });

  it('X-Content-Type-Options = nosniff', async () => {
    const headers = await extractHeaders(configPath);
    const xcto = headers.find((h) => h.key === 'X-Content-Type-Options')?.value ?? '';
    expect(xcto).toBe('nosniff');
  });
});
