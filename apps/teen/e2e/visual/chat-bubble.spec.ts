// e2e/visual/chat-bubble.spec.ts — S4 visual regression для ChatBubble.
// quality-gate §3 S4: 2 ролі × streaming on/off × mode 1–4/немає
// Матриця: viewport 375/768/1280 × locale uk × prefers-reduced-motion: reduce

import { test, expect, type Page } from '@playwright/test';
import {
  mockChat,
  mockChatStreamingHold,
  mockMessages,
  mockSessions,
  FIXTURE_CHAT_NORMAL,
} from '../helpers/sse';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const SESSION_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

async function loadChat(page: Page): Promise<void> {
  await mockSessions(page, SESSION_ID);
  await mockMessages(page);
  await mockChat(page, FIXTURE_CHAT_NORMAL);
  await page.goto(`/${SESSION_ID}`);
  await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });
}

// ---------------------------------------------------------------------------
// ChatBubble: роль user
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) {
  test.describe(`ChatBubble · user · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    test(`user bubble — idle · ${vp.name}px`, async ({ page }) => {
      await loadChat(page);
      await page.fill('textarea', 'тест повідомлення');
      await mockChat(page, { type: 'stream', tokens: ['я чую тебе.'] });
      await page.keyboard.press('Enter');
      const userBubble = page.locator('[class*="bg-accent"]').first();
      await userBubble.waitFor({ timeout: 5000 });
      await expect(page).toHaveScreenshot(`chat-bubble-user-idle-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        mask: [page.locator('[class*="tabular-nums"]')],
      });
    });
  });
}

// ---------------------------------------------------------------------------
// ChatBubble: роль assistant — mode 1–4 та без mode, streaming on/off
// ---------------------------------------------------------------------------

const MODES = [1, 2, 3, 4, null] as const;

for (const vp of VIEWPORTS) {
  for (const mode of MODES) {
    const modeSuffix = mode !== null ? `mode${mode}` : 'nomode';
    const modeToken = mode !== null ? ` [0${mode} · підтримую]` : '';

    test.describe(`ChatBubble · assistant · ${modeSuffix} · ${vp.name}px`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        locale: 'uk-UA',
        colorScheme: 'light',
        contextOptions: { reducedMotion: 'reduce' },
      });

      test(`streaming=off · ${modeSuffix} · ${vp.name}px`, async ({ page }) => {
        await mockSessions(page, SESSION_ID);
        await mockMessages(page);
        const fixture =
          mode !== null
            ? { type: 'stream' as const, tokens: [`я тут.${modeToken}`], mode: String(mode) }
            : { type: 'stream' as const, tokens: [`я тут.${modeToken}`] };
        await mockChat(page, fixture);
        await page.goto(`/${SESSION_ID}`);
        await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });

        await page.fill('textarea', 'привіт');
        await page.keyboard.press('Enter');
        await page.waitForSelector('[class*="animate-pulse"]', {
          state: 'detached',
          timeout: 8000,
        });

        await expect(page).toHaveScreenshot(
          `chat-bubble-assistant-${modeSuffix}-streaming-off-${vp.name}.png`,
          {
            maxDiffPixelRatio: 0.01,
            mask: [page.locator('[class*="tabular-nums"]')],
          },
        );
      });

      test(`streaming=on · ${modeSuffix} · ${vp.name}px`, async ({ page }) => {
        await mockSessions(page, SESSION_ID);
        await mockMessages(page);
        // Стрім «висить» відкритим — курсор streaming стабільний для скріншота.
        await mockChatStreamingHold(page, [`я тут.${modeToken}`]);
        await page.goto(`/${SESSION_ID}`);
        await page.waitForSelector('text=розкажи, як ти зараз', { timeout: 8000 });

        await page.fill('textarea', 'привіт');
        await page.keyboard.press('Enter');
        await page.waitForSelector('[class*="animate-pulse"]', { timeout: 5000 });

        await expect(page).toHaveScreenshot(
          `chat-bubble-assistant-${modeSuffix}-streaming-on-${vp.name}.png`,
          {
            maxDiffPixelRatio: 0.01,
            mask: [page.locator('[class*="tabular-nums"]')],
          },
        );
      });
    });
  }
}
