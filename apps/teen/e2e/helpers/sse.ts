// e2e/helpers/sse.ts — детерміновані SSE-фікстури для мокування /api/chat.
// Anthropic не викликається у E2E — весь стрім підміняється тут.
// quality-gate §3 S3: "Anthropic мокається через page.route() — детерміновані SSE-фікстури"

import type { Page, Route } from '@playwright/test';

// ---------------------------------------------------------------------------
// Типи фікстур
// ---------------------------------------------------------------------------

/** Нормальна SSE-відповідь з токенами */
export interface SseTokenFixture {
  type: 'stream';
  /** Масив текстів токенів. Буде з'єднано у бабблах через \n\n */
  tokens: string[];
  /** Опційний режим у done-події (для перевірки mode-лейбла) */
  mode?: string;
}

/** Кризова відповідь — JSON з type:'crisis' */
export interface SseCrisisFixture {
  type: 'crisis';
  message: string;
}

/** Перерваний стрім — імітує мережевий збій */
export interface SseAbortFixture {
  type: 'abort';
  /** Токени до обриву (може бути порожнім) */
  tokensBefore?: string[];
}

export type SseFixture = SseTokenFixture | SseCrisisFixture | SseAbortFixture;

// ---------------------------------------------------------------------------
// Кодування SSE-рядків
// ---------------------------------------------------------------------------

function sseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

/** Будує повне SSE-тіло для фікстури stream */
function buildSseBody(fixture: SseTokenFixture): string {
  const chunks: string[] = [];
  for (const token of fixture.tokens) {
    chunks.push(sseData({ type: 'token', text: token }));
  }
  const donePayload: Record<string, unknown> = { type: 'done' };
  if (fixture.mode) donePayload['mode'] = fixture.mode;
  chunks.push(sseData(donePayload));
  return chunks.join('');
}

// ---------------------------------------------------------------------------
// Готові фікстури
// ---------------------------------------------------------------------------

/** Стандартна відповідь — два баббла з mode-маркером */
export const FIXTURE_CHAT_NORMAL: SseTokenFixture = {
  type: 'stream',
  tokens: ['розкажи', ' більше.\n\n', '[02 · ДОСЛІДЖУЮ]'],
};

/** Відповідь без маркера (mode лейбл не змінюється) */
export const FIXTURE_CHAT_SIMPLE: SseTokenFixture = {
  type: 'stream',
  tokens: ['я чую тебе.'],
};

/** Кризова відповідь */
export const FIXTURE_CRISIS: SseCrisisFixture = {
  type: 'crisis',
  message: 'я тут. дай мені секунду — відкрию контакти, які можуть допомогти зараз.',
};

/** Обрив стріму після першого токена */
export const FIXTURE_STREAM_ABORT: SseAbortFixture = {
  type: 'abort',
  tokensBefore: ['починаю відповідати'],
};

// ---------------------------------------------------------------------------
// Основна функція мокування
// ---------------------------------------------------------------------------

/**
 * Перехоплює POST /api/chat і повертає детерміновану фікстуру.
 * Якщо fixture.type === 'abort' — повертає часткові дані і розриває з'єднання.
 */
export async function mockChat(page: Page, fixture: SseFixture): Promise<void> {
  await page.route('**/api/chat', async (route: Route) => {
    if (fixture.type === 'crisis') {
      // JSON-відповідь з type:'crisis' (не SSE)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'crisis', message: fixture.message }),
      });
      return;
    }

    if (fixture.type === 'abort') {
      // Повертаємо часткові дані, потім закриваємо без done-події.
      // page.route abort імітує мережевий збій з боку клієнта.
      if (fixture.tokensBefore && fixture.tokensBefore.length > 0) {
        const partial = fixture.tokensBefore
          .map((t) => sseData({ type: 'token', text: t }))
          .join('');
        // Повертаємо часткове тіло без done — читач потрапить у done=true
        // через закритий потік; finalizeStream() повинен спрацювати коректно.
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: partial,
        });
      } else {
        await route.abort('failed');
      }
      return;
    }

    // Нормальний SSE-стрім
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body: buildSseBody(fixture),
    });
  });
}

/**
 * Стрім, що «висить»: віддає токени і НЕ закриває потік.
 * Для visual-тестів стану streaming=on — курсор (animate-pulse) стабільно
 * видимий весь тест, без гонки з waitForSelector (route.fulfill віддає
 * тіло цілком і закриває стрім миттєво — стан зникає за мілісекунди).
 * Реалізовано через підміну window.fetch: route.fulfill не вміє відкритий потік.
 */
export async function mockChatStreamingHold(page: Page, tokens: string[]): Promise<void> {
  await page.addInitScript((toks: string[]) => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes('/api/chat')) return originalFetch(input, init);
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const t of toks) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', text: t })}\n\n`),
            );
          }
          // потік свідомо не закривається — UI лишається у стані streaming
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    };
  }, tokens);
}

/**
 * Перехоплює POST /api/sessions і повертає детермінований sessionId.
 * Дозволяє онбордингу завершитись без реального Supabase.
 */
export async function mockSessions(
  page: Page,
  sessionId = 'aabbccdd-0000-1111-2222-333344445555',
): Promise<string> {
  await page.route('**/api/sessions', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionId, persisted: false }),
    });
  });
  return sessionId;
}

/**
 * Перехоплює GET /api/sessions/[id]/messages і повертає порожній масив.
 * Без цього chat-сторінка може повиснути очікуючи гідратацію.
 */
export async function mockMessages(page: Page): Promise<void> {
  await page.route('**/api/sessions/*/messages', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages: [], persisted: false }),
    });
  });
}
