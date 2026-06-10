// e2e/visual/crisis-modal.spec.ts — S4 visual regression для CrisisModal.
// quality-gate §3 S4: phone / chat-hotline / ±onGrounding

import { test, expect, type Page } from '@playwright/test';
import { mockChat, mockMessages, mockSessions, FIXTURE_CRISIS } from '../helpers/sse';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const SESSION_ID = 'cccccccc-dddd-eeee-ffff-000000000000';

async function openCrisisModal(page: Page): Promise<void> {
  await mockSessions(page, SESSION_ID);
  await mockMessages(page);
  await mockChat(page, FIXTURE_CRISIS);
  await page.goto(`/${SESSION_ID}`);
  await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });
  await page.fill('textarea', 'мені дуже погано');
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
}

for (const vp of VIEWPORTS) {
  test.describe(`CrisisModal · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    test(`crisis modal — with grounding button · ${vp.name}px`, async ({ page }) => {
      await openCrisisModal(page);
      await page.waitForSelector('text=вправа заземлення', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`crisis-modal-with-grounding-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });

    test(`crisis modal — without grounding button (crisis page) · ${vp.name}px`, async ({
      page,
    }) => {
      await page.goto(`/crisis?sessionId=${SESSION_ID}`);
      await page.waitForSelector('text=я чую тебе', { timeout: 8000 });
      await expect(page).toHaveScreenshot(`crisis-modal-no-grounding-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    test(`crisis modal — phone hotline row · ${vp.name}px`, async ({ page }) => {
      await openCrisisModal(page);
      await page.waitForSelector('[href^="tel:"]', { timeout: 5000 });
      await expect(page.locator('[role="dialog"]')).toHaveScreenshot(
        `crisis-modal-hotline-row-phone-${vp.name}.png`,
        { maxDiffPixelRatio: 0.01 },
      );
    });

    test(`crisis modal — chat hotline row · ${vp.name}px`, async ({ page }) => {
      await openCrisisModal(page);
      // Teenergizer — chat hotline (note містить 'чат')
      const chatRow = page.locator('[href^="tel:7333"]');
      await chatRow.waitFor({ timeout: 5000 });
      await expect(chatRow).toHaveScreenshot(`crisis-modal-hotline-row-chat-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}
