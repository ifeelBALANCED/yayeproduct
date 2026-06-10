// e2e/pwa-sw.spec.ts — SW не кешує /api/* (quality-gate §3 S7).
//
// Перевіряє:
//   a) static:   текст sw.js не містить NetworkFirst/StaleWhileRevalidate/CacheFirst
//                для /api/-маршрутів; cacheName:"apis" відсутній або прив'язаний
//                до NetworkOnly; precache-маніфест не містить URL з "/api/" (без /_next/).
//   b) behavioral: після активації SW жоден Cache Storage не містить
//                  записів з pathname /api/*.

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// a) Статична перевірка тексту sw.js
// ---------------------------------------------------------------------------

test.describe('SW static — текст sw.js', () => {
  test('відсутнє правило NetworkFirst/StaleWhileRevalidate/CacheFirst для /api/', async ({
    page,
  }) => {
    const res = await page.request.get('/sw.js');
    expect(res.status()).toBe(200);
    const text = await res.text();

    // Перевіряємо що cacheName:"apis" з агресивною стратегією відсутній.
    // Допустимо лише якщо поруч є NetworkOnly (без networkTimeoutSeconds).
    // Найпростіший спосіб: шукаємо комбінацію 'apis' + NetworkFirst/StaleWhile/CacheFirst.
    const apisWithCaching =
      /cacheName['":\s]+"?apis"?[^}]{0,200}NetworkFirst|NetworkFirst[^}]{0,200}cacheName['":\s]+"?apis/.test(
        text,
      );
    expect(
      apisWithCaching,
      'cacheName:"apis" не повинен використовувати NetworkFirst — лише NetworkOnly',
    ).toBe(false);

    // Додатково: жодного StaleWhileRevalidate чи CacheFirst для /api/-шляхів
    const swrForApi = /StaleWhileRevalidate[^}]{0,300}\/api\//.test(text);
    const cacheFirstForApi = /CacheFirst[^}]{0,300}\/api\//.test(text);
    expect(swrForApi, 'StaleWhileRevalidate не повинен застосовуватись до /api/').toBe(false);
    expect(cacheFirstForApi, 'CacheFirst не повинен застосовуватись до /api/').toBe(false);
  });

  test('precache-маніфест не містить реальних /api/-URL (тільки /_next/static дозволено)', async ({
    page,
  }) => {
    const res = await page.request.get('/sw.js');
    expect(res.status()).toBe(200);
    const text = await res.text();

    // Знаходимо всі url у precache-маніфесті.
    // Формат: {url:"...",revision:"..."}
    const urlMatches = [...text.matchAll(/\{url:"([^"]+)"/g)].flatMap((m) => m[1] ?? []);
    expect(urlMatches.length, 'precache-маніфест має містити хоча б 1 запис').toBeGreaterThan(0);

    // Реальні /api/-ендпоінти (не статичні чанки /_next/static/chunks/app/api/)
    // не повинні бути у precache.
    // /_next/static/chunks/app/api/ — серверні route-бандли Next.js, вони виключаються
    // через buildExcludes у next.config.mjs.
    const apiPrecacheEntries = urlMatches.filter((u) => {
      // Виключаємо /_next/static/ — це статичні ресурси
      if (u.startsWith('/_next/static/')) return false;
      // Решта /api/* — недопустимо
      return u.includes('/api/');
    });

    expect(
      apiPrecacheEntries,
      `precache не повинен містити реальних /api/-URL: ${apiPrecacheEntries.join(', ')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// b) Поведінковий тест: Cache Storage не містить /api/-відповідей
// ---------------------------------------------------------------------------

test.describe('SW behavioral — Cache Storage порожній для /api/', () => {
  test('після GET /api/* жоден cache не містить /api/-записів', async ({ page }) => {
    // Відкриваємо головну сторінку — SW реєструється і активується
    await page.goto('/');

    // Чекаємо активації SW (navigator.serviceWorker.ready)
    const swActive = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('SW ready timeout')), 10_000),
          ),
        ]);
        return !!(reg as ServiceWorkerRegistration).active;
      } catch {
        return false;
      }
    });

    // SW повинен бути зареєстрований і активний у production build
    expect(swActive, 'SW повинен бути активним у production build').toBe(true);

    // Робимо GET-запит до /api/sessions щоб потенційно спровокувати кешування.
    // Відповідь нас не цікавить (може бути будь-який статус).
    await page.evaluate(async () => {
      try {
        await fetch('/api/sessions', { method: 'GET' });
      } catch {
        // ігноруємо помилку мережі — нас цікавить лише Cache Storage
      }
    });

    // Перевіряємо всі кеші: жоден не містить URL з /api/
    const apiCacheEntries = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const found: string[] = [];
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const req of keys) {
          const url = new URL(req.url);
          if (url.pathname.startsWith('/api/')) {
            found.push(`[${name}] ${url.pathname}`);
          }
        }
      }
      return found;
    });

    expect(
      apiCacheEntries,
      `Cache Storage не повинен містити /api/-записів: ${apiCacheEntries.join(', ')}`,
    ).toHaveLength(0);
  });
});
