// e2e/visual/onboarding.spec.ts — S4 visual regression для онбордингу.
// quality-gate §3 S4: 3 кроки + parental notice + submitting

import { test, expect, type Page } from '@playwright/test';
import { mockSessions } from '../helpers/sse';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

async function goToSplash(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('text=Я є', { timeout: 8000 });
}

for (const vp of VIEWPORTS) {
  test.describe(`Onboarding · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    // Крок 1: splash
    test(`step splash · ${vp.name}px`, async ({ page }) => {
      await goToSplash(page);
      await expect(page).toHaveScreenshot(`onboarding-splash-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Крок 2: age selection (без вибору)
    test(`step age — no selection · ${vp.name}px`, async ({ page }) => {
      await goToSplash(page);
      await page.click('button:has-text("почати")');
      await page.waitForSelector('text=скільки тобі років', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`onboarding-age-empty-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Parental notice — з'являється при виборі 13-15
    test(`parental notice (age 13-15) · ${vp.name}px`, async ({ page }) => {
      await goToSplash(page);
      await page.click('button:has-text("почати")');
      await page.waitForSelector('text=скільки тобі років', { timeout: 5000 });
      await page.click('button:has-text("13–15")');
      await page.waitForSelector('text=батьки або опікун', { timeout: 3000 });
      await expect(page).toHaveScreenshot(`onboarding-parental-notice-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Крок 3: name step
    test(`step name · ${vp.name}px`, async ({ page }) => {
      await mockSessions(page);
      await goToSplash(page);
      await page.click('button:has-text("почати")');
      await page.waitForSelector('text=скільки тобі років', { timeout: 5000 });
      await page.click('button:has-text("16–17")');
      await page.click('button:has-text("далі")');
      await page.waitForSelector('text=як до тебе звертатись', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`onboarding-name-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Стан submitting
    test(`submitting state · ${vp.name}px`, async ({ page }) => {
      await page.route('**/api/sessions', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await new Promise<void>((r) => setTimeout(r, 600));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ sessionId: 'ffffffff-0000-1111-2222-333333333333' }),
        });
      });

      await goToSplash(page);
      await page.click('button:has-text("почати")');
      await page.waitForSelector('text=скільки тобі років', { timeout: 5000 });
      await page.click('button:has-text("16–17")');
      await page.click('button:has-text("далі")');
      await page.waitForSelector('text=як до тебе звертатись', { timeout: 5000 });
      await page.fill('input[type="text"]', 'Аня');
      await page.click('button:has-text("далі")');
      await page.waitForSelector('text=починаємо', { timeout: 3000 });
      await expect(page).toHaveScreenshot(`onboarding-submitting-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}
