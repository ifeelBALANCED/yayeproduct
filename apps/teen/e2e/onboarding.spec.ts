// e2e/onboarding.spec.ts — флоу онбордингу (quality-gate §3 S3).
//
// Перевіряє:
//   1. splash → age-вибір → name → редірект у сесію
//   2. При виборі 13-15: parental notice видимий
//   3. Перехоплення POST /api/chat: body містить ageBand з онбордингу
//
// Демо-режим: POST /api/sessions мокується → реальний Supabase не потрібен.
//
// ПРИМІТКА (якість S2/CI): повна перевірка «age_band збережено і використано
// в системному промпті» реалізована у S2 (DB-інтеграційні тести), бо потребує
// реального збереження у Supabase + читання з БД у route.ts. Тут ми перевіряємо
// лише що клієнтський код передає ageBand у тілі /api/chat у demo-режимі (P0-3).

import { test, expect } from '@playwright/test';
import { mockSessions, mockMessages, mockChat, FIXTURE_CHAT_SIMPLE } from './helpers/sse';

test.describe('Онбординг', () => {
  test('splash → age-вибір → name → редірект у сесію', async ({ page }) => {
    const sessionId = await mockSessions(page);
    await mockMessages(page);

    await page.goto('/');

    // ── Splash ────────────────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: 'Я є' })).toBeVisible();
    await expect(page.getByText('я не людина · я алгоритм')).toBeVisible();

    await page.getByRole('button', { name: 'почати' }).click();

    // ── Age-крок ──────────────────────────────────────────────────────────
    await expect(page.getByText('скільки тобі років?')).toBeVisible();

    // Вибираємо 16-17 (без parental notice)
    await page.getByRole('button', { name: '16–17' }).click();
    await expect(page.getByText('вибрано')).toBeVisible();

    await page.getByRole('button', { name: 'далі' }).click();

    // ── Name-крок ─────────────────────────────────────────────────────────
    await expect(page.getByText('як до тебе звертатись?')).toBeVisible();

    await page.getByRole('textbox').fill('Тест');
    await page.getByRole('button', { name: 'далі' }).click();

    // ── Редірект у сесію ──────────────────────────────────────────────────
    await page.waitForURL(`/${sessionId}`);
    // Chat-сторінка змонтована — greeting від AI видимий
    await expect(page.getByText('розкажи, як ти зараз, Тест?')).toBeVisible({ timeout: 5000 });
  });

  test('age 13-15 → parental notice видимий', async ({ page }) => {
    await mockSessions(page);
    await mockMessages(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'почати' }).click();

    // Вибираємо 13–15
    await page.getByRole('button', { name: '13–15' }).click();

    // Parental notice повинен з'явитись одразу після вибору
    await expect(page.getByText(/якщо тобі 13–15, батьки або опікун мають знати/)).toBeVisible();
  });

  test('parental notice зникає при виборі іншого вікового діапазону', async ({ page }) => {
    await mockSessions(page);
    await mockMessages(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'почати' }).click();

    await page.getByRole('button', { name: '13–15' }).click();
    await expect(page.getByText(/якщо тобі 13–15/)).toBeVisible();

    // Перемикаємось на 18–25 — notice зникає
    await page.getByRole('button', { name: '18–25' }).click();
    await expect(page.getByText(/якщо тобі 13–15/)).not.toBeVisible();
  });

  test('POST /api/chat містить ageBand з онбордингу (demo-режим, анти-P0-3)', async ({ page }) => {
    // ПРИМІТКА: Повна перевірка «age_band використано в промпті» належить S2/CI
    // (DB-інтеграція). Тут перевіряємо лише що клієнт передає ageBand у тілі запиту.
    const sessionId = await mockSessions(page);
    await mockMessages(page);
    await mockChat(page, FIXTURE_CHAT_SIMPLE);

    // Збираємо тіло запитів до /api/chat
    const chatRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/chat') && req.method() === 'POST') {
        chatRequests.push(req.postData() ?? '');
      }
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'почати' }).click();
    await page.getByRole('button', { name: '16–17' }).click();
    await page.getByRole('button', { name: 'далі' }).click();
    await page.getByRole('button', { name: 'продовжити без імені' }).click();

    await page.waitForURL(`/${sessionId}`);
    // Чекаємо greeting
    await expect(page.getByText('розкажи, як ти зараз?')).toBeVisible({ timeout: 5000 });

    // Відправляємо повідомлення
    await page.getByRole('textbox', { name: 'напиши тут...' }).fill('привіт');
    await page.getByRole('button', { name: 'надіслати' }).click();

    // Чекаємо поки запит відбудеться
    await page.waitForResponse('**/api/chat');

    expect(chatRequests.length).toBeGreaterThan(0);
    const body = JSON.parse(chatRequests[0]!);
    // ageBand повинен збігатись з тим що вибрали на онбордингу
    expect(body.ageBand).toBe('16-17');
  });

  test('skip name → сесія без userName', async ({ page }) => {
    const sessionId = await mockSessions(page);
    await mockMessages(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'почати' }).click();
    await page.getByRole('button', { name: '18–25' }).click();
    await page.getByRole('button', { name: 'далі' }).click();
    await page.getByRole('button', { name: 'продовжити без імені' }).click();

    await page.waitForURL(`/${sessionId}`);
    // Greeting без імені
    await expect(page.getByText('розкажи, як ти зараз?')).toBeVisible({ timeout: 5000 });
  });
});
