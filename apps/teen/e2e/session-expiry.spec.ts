// e2e/session-expiry.spec.ts — таймер сесії і expire-флоу (quality-gate §3 S3).
//
// Перевіряє:
//   1. Таймер → exit-екран (page.clock.runFor — просуває час і тригерить timers)
//   2. Після unmount таймер не стріляє (відсутність пізніх DOM-мутацій/помилок у console)
//
// page.clock.runFor: Playwright 1.45+ підтримує мокування часу в браузері.
// SessionTimer у chat/[sessionId]/page.tsx — 25 хвилин = 1500000ms.
//
// CAVEAT: якщо page.clock.runFor не тригерить React-інтервали (залежно від
// Next.js dev/prod режиму та React Strict Mode double-invoke), тести таймера
// можуть бути нестабільними. Для надійного CI рекомендується запускати проти
// production build (next build + next start). Зараз тести запускаються проти
// dev сервера через відому проблему з next build (useSearchParams у /crisis без Suspense).

import { test, expect } from '@playwright/test';
import { mockSessions, mockMessages } from './helpers/sse';

const SESSION_ID = 'aabbccdd-0000-1111-2222-333344445555';

test.describe('Таймер сесії', () => {
  test('таймер → exit-екран через page.clock', async ({ page }) => {
    // page.clock.install має викликатись ДО goto
    await page.clock.install({ time: 0 });

    await mockSessions(page, SESSION_ID);
    await mockMessages(page);

    await page.goto(`/${SESSION_ID}`);
    await expect(page.getByText('розкажи, як ти зараз?')).toBeVisible({ timeout: 8000 });

    // SessionTimer = 25 хвилин = 1500000ms.
    // runFor просуває мок-час і виконує всі pending setInterval/setTimeout.
    await page.clock.runFor(25 * 60 * 1000 + 1000);

    // Closing-баблі від handleExpire
    await expect(page.getByText('час. сесія закривається — це за дизайном.')).toBeVisible({
      timeout: 5000,
    });

    // Після 8 с (ще одна перемотка) — редірект на /exit
    await page.clock.runFor(9000);
    await page.waitForURL(`/${SESSION_ID}/exit`, { timeout: 10000 });

    // Exit-екран рендериться
    await expect(page.getByText('сесія')).toBeVisible();
    await expect(page.getByText('завершена')).toBeVisible();
  });

  test('таймер не стріляє після unmount (відсутність setTimeout-leak)', async ({ page }) => {
    // Збираємо console-помилки — React у dev mode логує setState після unmount
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.clock.install({ time: 0 });
    await mockSessions(page, SESSION_ID);
    await mockMessages(page);

    await page.goto(`/${SESSION_ID}`);
    await expect(page.getByText('розкажи, як ти зараз?')).toBeVisible({ timeout: 8000 });

    // Navigating away = unmount SessionTimer.
    // SessionTimer використовує clearInterval у cleanup useEffect — тому
    // інтервал зупиняється при unmount.
    await page.goto('/');

    // Після unmount просуваємо ще 30 хв — таймер не повинен викликати setState
    await page.clock.runFor(30 * 60 * 1000);

    // Даємо час для появи можливих асинхронних помилок у console
    await page.waitForTimeout(300);

    // Жодної помилки про setState після unmount
    const stateUpdateErrors = consoleErrors.filter(
      (e) =>
        e.includes('unmounted') ||
        e.includes('setState') ||
        e.includes('Warning: Can') ||
        e.includes('state update'),
    );
    expect(stateUpdateErrors).toHaveLength(0);
  });

  test('input задізейблений після expire', async ({ page }) => {
    await page.clock.install({ time: 0 });
    await mockSessions(page, SESSION_ID);
    await mockMessages(page);

    await page.goto(`/${SESSION_ID}`);
    await expect(page.getByText('розкажи, як ти зараз?')).toBeVisible({ timeout: 8000 });

    await page.clock.runFor(25 * 60 * 1000 + 1000);

    // Після expire textarea disabled. Textarea не має aria-label/name — шукаємо через placeholder.
    // До expire: placeholder="напиши тут...", після expire: placeholder="сесія завершена".
    await expect(page.getByPlaceholder('сесія завершена')).toBeDisabled({ timeout: 5000 });

    // Send-кнопка теж задізейблена
    await expect(page.getByRole('button', { name: 'надіслати' })).toBeDisabled();
  });

  test('exit-сторінка рендериться коректно', async ({ page }) => {
    await page.goto(`/${SESSION_ID}/exit`);

    await expect(page.getByText('[GRADUATION · COMPLETED]')).toBeVisible();
    await expect(page.getByText('25 хвилин пройшло.')).toBeVisible();

    // Посилання на specialists і на головну
    await expect(page.getByRole('link', { name: 'поговорити з фахівцем' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'на головну' })).toBeVisible();

    // Антипатерн «we miss you» — відсутній
    await expect(page.getByText(/we miss you/i)).not.toBeVisible();
    await expect(page.getByText(/скучаємо/i)).not.toBeVisible();
  });
});
