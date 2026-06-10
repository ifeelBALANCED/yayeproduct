// e2e/visual/specialists.spec.ts — S4 visual regression для specialists-компонентів.
// quality-gate §3 S4: SessionTypeCard ±recommended, SpecialistCard,
// CalendarMockup (порожній/обраний слот, 375px snap-scroll)

import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Specialists components · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    // SpecialistCard у directory
    test(`SpecialistCard · ${vp.name}px`, async ({ page }) => {
      await page.goto('/specialists');
      await page.waitForSelector('text=Фахівці, з якими ми працюємо', { timeout: 8000 });
      const firstCard = page.locator('a[href^="/specialists/"]').first();
      await firstCard.waitFor({ timeout: 5000 });
      await expect(firstCard).toHaveScreenshot(`specialist-card-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // SessionTypeCard recommended (profile-сторінка)
    test(`SessionTypeCard recommended · ${vp.name}px`, async ({ page }) => {
      await page.goto('/specialists/olena-vovk');
      // Чекаємо recommended картку (border-2 border-accent)
      await page.waitForSelector('[class*="border-2"][class*="border-accent"]', { timeout: 8000 });
      const recommendedCard = page.locator('[class*="border-2"][class*="border-accent"]').first();
      await expect(recommendedCard).toHaveScreenshot(
        `session-type-card-recommended-${vp.name}.png`,
        { maxDiffPixelRatio: 0.01 },
      );
    });

    // SessionTypeCard not recommended — скріншот всього блоку сесій
    test(`SessionTypeCard not-recommended context · ${vp.name}px`, async ({ page }) => {
      await page.goto('/specialists/olena-vovk');
      await page.waitForSelector('a[href*="/book/"]', { timeout: 8000 });
      // Скріншот секції з картками сесій (contains all session type cards)
      const sessionSection = page
        .locator('section')
        .filter({
          has: page.locator('a[href*="/book/"]'),
        })
        .first();
      await expect(sessionSection).toHaveScreenshot(`session-type-cards-section-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // CalendarMockup — порожній
    test(`CalendarMockup empty · ${vp.name}px`, async ({ page }) => {
      await page.goto('/specialists/olena-vovk/book/thematic');
      await page.waitForSelector('text=наступні 7 днів', { timeout: 8000 });
      // Контейнер CalendarMockup
      const calContainer = page
        .locator('div')
        .filter({ has: page.locator('text=наступні 7 днів') })
        .first();
      await expect(calContainer).toHaveScreenshot(`calendar-mockup-empty-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // CalendarMockup — обраний слот
    test(`CalendarMockup with selected slot · ${vp.name}px`, async ({ page }) => {
      await page.goto('/specialists/olena-vovk/book/thematic');
      await page.waitForSelector('text=наступні 7 днів', { timeout: 8000 });
      // Перший слот з часом (10:00, 14:30, тощо)
      const firstSlot = page
        .locator('button[type="button"]')
        .filter({ hasText: /^\d+:\d+$/ })
        .first();
      await firstSlot.waitFor({ timeout: 5000 });
      await firstSlot.click();
      const calContainer = page
        .locator('div')
        .filter({ has: page.locator('text=наступні 7 днів') })
        .first();
      await expect(calContainer).toHaveScreenshot(`calendar-mockup-selected-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    // CalendarMockup snap-scroll — тільки 375px
    test(`CalendarMockup snap-scroll · ${vp.name}px`, async ({ page }) => {
      if (vp.width !== 375) {
        test.skip(true, 'snap-scroll актуальний тільки для 375px viewport');
        return;
      }
      await page.goto('/specialists/olena-vovk/book/thematic');
      await page.waitForSelector('text=наступні 7 днів', { timeout: 8000 });
      const snapContainer = page.locator('[class*="snap-x"]').first();
      await snapContainer.waitFor({ timeout: 5000 });
      await snapContainer.evaluate((el) => {
        el.scrollLeft = 120;
      });
      // Коротка пауза для snap settling
      await page.waitForTimeout(200);
      await expect(snapContainer).toHaveScreenshot(`calendar-snap-scroll-375.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}
