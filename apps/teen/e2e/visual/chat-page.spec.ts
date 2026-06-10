// e2e/visual/chat-page.spec.ts — S4 visual regression для Chat-сторінки.
// quality-gate §3 S4:
//   порожня / зі стрімом / crisis open / postCrisis / exercise card collapsed+expanded
//   SOS-кнопка

import { test, expect, type Page } from '@playwright/test';
import {
  mockChat,
  mockChatStreamingHold,
  mockMessages,
  mockSessions,
  FIXTURE_CHAT_NORMAL,
  FIXTURE_CRISIS,
} from '../helpers/sse';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const SESSION_ID = '11111111-2222-3333-4444-555555555555';

async function loadEmptyChat(page: Page): Promise<void> {
  await mockSessions(page, SESSION_ID);
  await mockMessages(page);
  await mockChat(page, FIXTURE_CHAT_NORMAL);
  await page.goto(`/${SESSION_ID}`);
  await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });
}

for (const vp of VIEWPORTS) {
  test.describe(`Chat page · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    // ── Порожня (тільки greeting) ──────────────────────────────────────────
    test(`empty chat (greeting only) · ${vp.name}px`, async ({ page }) => {
      await loadEmptyChat(page);
      await expect(page).toHaveScreenshot(`chat-page-empty-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });

    // ── SOS кнопка ────────────────────────────────────────────────────────
    test(`SOS button · ${vp.name}px`, async ({ page }) => {
      await loadEmptyChat(page);
      // Точний href: у чаті є другий лінк "SOS →" з ?sessionId= (back-link).
      const sosLink = page.locator('a[href="/crisis"]');
      await sosLink.waitFor({ timeout: 5000 });
      await expect(sosLink).toHaveScreenshot(`chat-page-sos-button-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // ── Зі стрімом ────────────────────────────────────────────────────────
    test(`streaming response · ${vp.name}px`, async ({ page }) => {
      await mockSessions(page, SESSION_ID);
      await mockMessages(page);
      // Стрім «висить» відкритим — курсор streaming стабільний для скріншота.
      await mockChatStreamingHold(page, ['я тут. розкажи більше.']);
      await page.goto(`/${SESSION_ID}`);
      await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });

      await page.fill('textarea', 'привіт');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[class*="animate-pulse"]', { timeout: 5000 });

      await expect(page).toHaveScreenshot(`chat-page-streaming-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });

    // ── Crisis modal open ─────────────────────────────────────────────────
    test(`crisis modal open · ${vp.name}px`, async ({ page }) => {
      await mockSessions(page, SESSION_ID);
      await mockMessages(page);
      await mockChat(page, FIXTURE_CRISIS);
      await page.goto(`/${SESSION_ID}`);
      await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });

      await page.fill('textarea', 'мені дуже погано');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[role="dialog"]', { timeout: 8000 });

      await expect(page).toHaveScreenshot(`chat-page-crisis-open-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });

    // ── postCrisis стан ───────────────────────────────────────────────────
    test(`post crisis state · ${vp.name}px`, async ({ page }) => {
      await mockSessions(page, SESSION_ID);
      await mockMessages(page);
      await mockChat(page, FIXTURE_CRISIS);
      await page.goto(`/${SESSION_ID}`);
      await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });

      await page.fill('textarea', 'мені дуже погано');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
      await page.click('button:has-text("повернутись до розмови")');
      await page.waitForSelector('text=ти повернувся', { timeout: 5000 });

      await expect(page).toHaveScreenshot(`chat-page-post-crisis-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });

    // ── Exercise card collapsed ────────────────────────────────────────────
    test(`exercise card collapsed · ${vp.name}px`, async ({ page }) => {
      await mockSessions(page, SESSION_ID);
      await mockMessages(page);
      await mockChat(page, {
        type: 'stream',
        tokens: ['[ВПРАВА · дихання 4-6]'],
      });
      await page.goto(`/${SESSION_ID}`);
      await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });

      await page.fill('textarea', 'можеш дати вправу?');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[class*="animate-pulse"]', { state: 'detached', timeout: 8000 });
      // ExerciseCard: rounded-2xl border border-divider bg-bgSoft з mono-текстом
      await page.waitForSelector('p[class*="font-mono"][class*="uppercase"]', { timeout: 5000 });

      await expect(page).toHaveScreenshot(`chat-page-exercise-collapsed-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });

    // ── Exercise card expanded ────────────────────────────────────────────
    test(`exercise card expanded · ${vp.name}px`, async ({ page }) => {
      await mockSessions(page, SESSION_ID);
      await mockMessages(page);
      await mockChat(page, {
        type: 'stream',
        tokens: ['[ВПРАВА · дихання 4-6]'],
      });
      await page.goto(`/${SESSION_ID}`);
      await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });

      await page.fill('textarea', 'можеш дати вправу?');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[class*="animate-pulse"]', { state: 'detached', timeout: 8000 });
      // Знаходимо CTA-кнопку expand (font-mono text-accent)
      const expandBtn = page.locator('button[class*="font-mono"][class*="text-accent"]').first();
      await expandBtn.waitFor({ timeout: 5000 });
      await expandBtn.click();
      // Чекаємо ol з кроками
      await page.waitForSelector('ol', { timeout: 3000 });

      await expect(page).toHaveScreenshot(`chat-page-exercise-expanded-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });
  });
}
