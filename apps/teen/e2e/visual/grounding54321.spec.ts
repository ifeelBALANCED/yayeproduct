// e2e/visual/grounding54321.spec.ts — S4 visual regression для Grounding54321.
// quality-gate §3 S4: steps 0–4 + done

import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

async function openGrounding(page: Page): Promise<void> {
  await page.goto('/crisis');
  await page.waitForSelector('text=вправа 5-4-3-2-1', { timeout: 8000 });
  await page.click('button:has-text("вправа 5-4-3-2-1")');
  await page.waitForSelector('text=назви 5 речей', { timeout: 5000 });
}

for (const vp of VIEWPORTS) {
  test.describe(`Grounding54321 · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    // Крок 0 — collapsed trigger button
    test(`step 0 — collapsed · ${vp.name}px`, async ({ page }) => {
      await page.goto('/crisis');
      await page.waitForSelector('text=вправа 5-4-3-2-1', { timeout: 8000 });
      await expect(page.locator('button:has-text("вправа 5-4-3-2-1")').first()).toHaveScreenshot(
        `grounding-step0-collapsed-${vp.name}.png`,
        { maxDiffPixelRatio: 0.01 },
      );
    });

    // Крок 1 (5 речей)
    test(`step 1 — sense:очі · ${vp.name}px`, async ({ page }) => {
      await openGrounding(page);
      await expect(page).toHaveScreenshot(`grounding-step1-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Крок 2 (4 дотики)
    test(`step 2 — sense:дотик · ${vp.name}px`, async ({ page }) => {
      await openGrounding(page);
      await page.click('button:has-text("далі")');
      await page.waitForSelector('text=торкнись 4 різних', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`grounding-step2-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Крок 3 (3 звуки)
    test(`step 3 — sense:вуха · ${vp.name}px`, async ({ page }) => {
      await openGrounding(page);
      await page.click('button:has-text("далі")');
      await page.click('button:has-text("далі")');
      await page.waitForSelector('text=почуй 3 звуки', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`grounding-step3-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Крок 4 (2 запахи)
    test(`step 4 — sense:запах · ${vp.name}px`, async ({ page }) => {
      await openGrounding(page);
      for (let i = 0; i < 3; i++) await page.click('button:has-text("далі")');
      await page.waitForSelector('text=відчуй 2 запахи', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`grounding-step4-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Крок 5 (1 смак) — кнопка «завершити»
    test(`step 5 — sense:смак · ${vp.name}px`, async ({ page }) => {
      await openGrounding(page);
      for (let i = 0; i < 4; i++) await page.click('button:has-text("далі")');
      await page.waitForSelector('text=1 смак', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`grounding-step5-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // Стан done
    test(`done state · ${vp.name}px`, async ({ page }) => {
      await openGrounding(page);
      for (let i = 0; i < 4; i++) await page.click('button:has-text("далі")');
      await page.click('button:has-text("завершити")');
      await page.waitForSelector('text=ти тут.', { timeout: 5000 });
      await expect(page).toHaveScreenshot(`grounding-done-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}
