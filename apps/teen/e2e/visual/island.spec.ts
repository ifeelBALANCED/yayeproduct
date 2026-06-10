// e2e/visual/island.spec.ts — S4 visual regression для Island компонента.
// quality-gate §3 S4: hero / mini / explainer + activeFm 1–4 (клік на шар)
//
// CAVEAT: Island живе у packages/ui і використовується у apps/landing (port 3001).
// apps/teen не рендерить Island. Якщо landing недоступний — тести skip.
// mini / explainer — немає роуту у teen або landing: test.fixme з поясненням.

import { test, expect, type Page } from '@playwright/test';

const LANDING_BASE = 'http://localhost:3001';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

async function tryLanding(page: Page, path = '/'): Promise<boolean> {
  try {
    const res = await page.goto(`${LANDING_BASE}${path}`, { timeout: 5000 });
    return res !== null && res.status() < 400;
  } catch {
    return false;
  }
}

for (const vp of VIEWPORTS) {
  test.describe(`Island · hero · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    test(`Island hero — no activeFm · ${vp.name}px`, async ({ page }) => {
      const available = await tryLanding(page, '/');
      if (!available) {
        test.skip(
          true,
          'Landing (port 3001) недоступний. Запустіть: pnpm --filter @ya-ye/landing dev --port 3001',
        );
        return;
      }
      await page.waitForSelector('h1', { timeout: 8000 });
      if (vp.width >= 768) {
        const islandEl = page.locator('.island-svg').first();
        await islandEl.waitFor({ timeout: 5000 });
        await expect(islandEl).toHaveScreenshot(`island-hero-no-active-${vp.name}.png`, {
          maxDiffPixelRatio: 0.01,
        });
      } else {
        // 375px — Island прихований (hidden md:flex), скріншот hero-секції
        await expect(page.locator('section').first()).toHaveScreenshot(
          `island-hero-hidden-mobile-${vp.name}.png`,
          { maxDiffPixelRatio: 0.01 },
        );
      }
    });

    test(`Island hero — activeFm 1 · ${vp.name}px`, async ({ page }) => {
      if (vp.width < 768) {
        test.skip(true, 'Island прихований на 375px (hidden md:flex)');
        return;
      }
      const available = await tryLanding(page, '/');
      if (!available) {
        test.skip(true, 'Landing (port 3001) недоступний');
        return;
      }
      await page.waitForSelector('.island-svg', { timeout: 8000 });
      await page.locator('[data-fm="1"]').first().click();
      await page.waitForSelector('text=берег', { timeout: 3000 });
      await expect(page.locator('.island-svg').first()).toHaveScreenshot(
        `island-hero-activefm1-${vp.name}.png`,
        { maxDiffPixelRatio: 0.01 },
      );
    });

    test(`Island hero — activeFm 2 · ${vp.name}px`, async ({ page }) => {
      if (vp.width < 768) {
        test.skip(true, 'Island прихований на 375px');
        return;
      }
      const available = await tryLanding(page, '/');
      if (!available) {
        test.skip(true, 'Landing (port 3001) недоступний');
        return;
      }
      await page.waitForSelector('.island-svg', { timeout: 8000 });
      await page.locator('[data-fm="2"]').first().click();
      await page.waitForSelector('text=бухта', { timeout: 3000 });
      await expect(page.locator('.island-svg').first()).toHaveScreenshot(
        `island-hero-activefm2-${vp.name}.png`,
        { maxDiffPixelRatio: 0.01 },
      );
    });

    test(`Island hero — activeFm 3 · ${vp.name}px`, async ({ page }) => {
      if (vp.width < 768) {
        test.skip(true, 'Island прихований на 375px');
        return;
      }
      const available = await tryLanding(page, '/');
      if (!available) {
        test.skip(true, 'Landing (port 3001) недоступний');
        return;
      }
      await page.waitForSelector('.island-svg', { timeout: 8000 });
      await page.locator('[data-fm="3"]').first().click();
      await page.waitForSelector('text=скеля', { timeout: 3000 });
      await expect(page.locator('.island-svg').first()).toHaveScreenshot(
        `island-hero-activefm3-${vp.name}.png`,
        { maxDiffPixelRatio: 0.01 },
      );
    });

    test(`Island hero — activeFm 4 · ${vp.name}px`, async ({ page }) => {
      if (vp.width < 768) {
        test.skip(true, 'Island прихований на 375px');
        return;
      }
      const available = await tryLanding(page, '/');
      if (!available) {
        test.skip(true, 'Landing (port 3001) недоступний');
        return;
      }
      await page.waitForSelector('.island-svg', { timeout: 8000 });
      await page.locator('[data-fm="4"]').first().click();
      await page.waitForSelector('text=маяк', { timeout: 3000 });
      await expect(page.locator('.island-svg').first()).toHaveScreenshot(
        `island-hero-activefm4-${vp.name}.png`,
        { maxDiffPixelRatio: 0.01 },
      );
    });

    // mini і explainer — немає роуту
    test(`Island mini variant · ${vp.name}px`, async () => {
      test.fixme(
        true,
        'mini/explainer — немає роуту у teen або landing. Борг: /island-demo або Storybook (>30 компонентів, quality-gate §S4).',
      );
    });

    test(`Island explainer variant · ${vp.name}px`, async () => {
      test.fixme(true, 'explainer — немає роуту у teen або landing. Той самий борг що mini.');
    });
  });
}
