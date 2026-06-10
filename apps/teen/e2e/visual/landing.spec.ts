// e2e/visual/landing.spec.ts — S4 visual regression для Landing і GroundingMinute.
// quality-gate §3 S4:
//   Landing hero 375 без Island / 1280 з Island
//   GroundingMinute states 0–7
//
// CAVEAT: Landing app на port 3001, поза поточним webServer (port 3000 = teen).
// Якщо landing недоступний — тести skip з поясненням.
// Для локального запуску: pnpm --filter @ya-ye/landing dev --port 3001

import { test, expect, type Page } from '@playwright/test';

const LANDING_BASE = 'http://localhost:3001';
const STEPS_COUNT = 5;

async function tryLanding(page: Page, path = '/'): Promise<boolean> {
  try {
    const res = await page.goto(`${LANDING_BASE}${path}`, { timeout: 5000 });
    return res !== null && res.status() < 400;
  } catch {
    return false;
  }
}

// Хелпер: знаходить widget GroundingMinute за наявністю тексту "хвилина тут"
function groundingWidget(page: Page) {
  return page
    .locator('[class*="rounded-2xl"][class*="border-divider"]')
    .filter({ has: page.locator('text=хвилина тут') })
    .first();
}

// ---------------------------------------------------------------------------
// Landing hero
// ---------------------------------------------------------------------------

test.describe('Landing hero · 375px', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    locale: 'uk-UA',
    colorScheme: 'light',
    contextOptions: { reducedMotion: 'reduce' },
  });

  test('hero 375px — without Island (hidden md:flex)', async ({ page }) => {
    const ok = await tryLanding(page, '/');
    if (!ok) {
      test.skip(
        true,
        'Landing (port 3001) недоступний. Запустіть: pnpm --filter @ya-ye/landing dev --port 3001',
      );
      return;
    }
    await page.waitForSelector('h1', { timeout: 8000 });
    await expect(page.locator('section').first()).toHaveScreenshot(
      'landing-hero-375-no-island.png',
      { maxDiffPixelRatio: 0.01 },
    );
  });
});

test.describe('Landing hero · 1280px', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    locale: 'uk-UA',
    colorScheme: 'light',
    contextOptions: { reducedMotion: 'reduce' },
  });

  test('hero 1280px — with Island', async ({ page }) => {
    const ok = await tryLanding(page, '/');
    if (!ok) {
      test.skip(true, 'Landing (port 3001) недоступний.');
      return;
    }
    await page.waitForSelector('.island-svg', { timeout: 8000 });
    await expect(page.locator('section').first()).toHaveScreenshot(
      'landing-hero-1280-with-island.png',
      { maxDiffPixelRatio: 0.01 },
    );
  });
});

// ---------------------------------------------------------------------------
// GroundingMinute state 0
// ---------------------------------------------------------------------------

test.describe('GroundingMinute · state 0', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    locale: 'uk-UA',
    colorScheme: 'light',
    contextOptions: { reducedMotion: 'reduce' },
  });

  test('GroundingMinute state 0 — not started', async ({ page }) => {
    const ok = await tryLanding(page, '/');
    if (!ok) {
      test.skip(true, 'Landing недоступний.');
      return;
    }
    await page.waitForSelector('text=Озирнись', { timeout: 8000 });
    await expect(groundingWidget(page)).toHaveScreenshot('grounding-minute-state0.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

// ---------------------------------------------------------------------------
// GroundingMinute states 1–5 (active steps)
// ---------------------------------------------------------------------------

for (let stepN = 1; stepN <= STEPS_COUNT; stepN++) {
  test.describe(`GroundingMinute · state ${stepN}`, () => {
    test.use({
      viewport: { width: 375, height: 812 },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    test(`GroundingMinute state ${stepN} — step active`, async ({ page }) => {
      const ok = await tryLanding(page, '/');
      if (!ok) {
        test.skip(true, 'Landing недоступний.');
        return;
      }
      await page.waitForSelector('text=Озирнись', { timeout: 8000 });
      await page.click('button:has-text("почати →")');
      for (let i = 1; i < stepN; i++) {
        await page.click('button:has-text("далі →")');
        await page.waitForTimeout(80);
      }
      await expect(groundingWidget(page)).toHaveScreenshot(`grounding-minute-state${stepN}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}

// ---------------------------------------------------------------------------
// GroundingMinute state 6 (feedback)
// ---------------------------------------------------------------------------

test.describe('GroundingMinute · state 6 · feedback', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    locale: 'uk-UA',
    colorScheme: 'light',
    contextOptions: { reducedMotion: 'reduce' },
  });

  test('GroundingMinute state 6 — feedback', async ({ page }) => {
    const ok = await tryLanding(page, '/');
    if (!ok) {
      test.skip(true, 'Landing недоступний.');
      return;
    }
    await page.waitForSelector('text=Озирнись', { timeout: 8000 });
    await page.click('button:has-text("почати →")');
    for (let i = 1; i < STEPS_COUNT; i++) {
      await page.click('button:has-text("далі →")');
    }
    await page.click('button:has-text("готово →")');
    await page.waitForSelector('text=Як тобі?', { timeout: 5000 });
    await expect(groundingWidget(page)).toHaveScreenshot('grounding-minute-state6.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

// ---------------------------------------------------------------------------
// GroundingMinute state 7 (done)
// ---------------------------------------------------------------------------

test.describe('GroundingMinute · state 7 · done', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    locale: 'uk-UA',
    colorScheme: 'light',
    contextOptions: { reducedMotion: 'reduce' },
  });

  test('GroundingMinute state 7 — done (helped)', async ({ page }) => {
    await page.route('**/api/exercise-feedback', async (route) => {
      await route.fulfill({ status: 200, body: '{}' });
    });

    const ok = await tryLanding(page, '/');
    if (!ok) {
      test.skip(true, 'Landing недоступний.');
      return;
    }
    await page.waitForSelector('text=Озирнись', { timeout: 8000 });
    await page.click('button:has-text("почати →")');
    for (let i = 1; i < STEPS_COUNT; i++) {
      await page.click('button:has-text("далі →")');
    }
    await page.click('button:has-text("готово →")');
    await page.waitForSelector('text=Як тобі?', { timeout: 5000 });
    await page.click('button:has-text("трохи краще")');
    await page.waitForSelector('text=добре.', { timeout: 5000 });
    await expect(groundingWidget(page)).toHaveScreenshot('grounding-minute-state7.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
