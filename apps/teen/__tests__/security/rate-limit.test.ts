// S5 rate-limit тест (quality-gate §S5).
// Перевіряє що N+1-й виклик → 429 через RateLimiterPort.
// Тестується через команди sendMessage, createSession, deleteSession напряму —
// без HTTP, без живої БД.

import { describe, it, expect } from 'vitest';
import { sendMessage } from '../../src/server/commands/sendMessage';
import { createSession } from '../../src/server/commands/createSession';
import { deleteSession } from '../../src/server/commands/deleteSession';
import { getSessionMessages } from '../../src/server/queries/getSessionMessages';
import type { RateLimiterPort } from '../../src/server/ports/rateLimiter';
import type { AnthropicPort } from '../../src/server/ports/anthropic';
import type { ClockPort } from '../../src/server/ports/clock';

// ---------------------------------------------------------------------------
// Фейкові порти
// ---------------------------------------------------------------------------

const allowAllLimiter: RateLimiterPort = { allow: () => true };
const blockAllLimiter: RateLimiterPort = { allow: () => false };

// Лімітер з лічильником: перші N викликів — allow, потім block.
function makeCountingLimiter(allowCount: number): RateLimiterPort {
  let calls = 0;
  return {
    allow(_key: string, _limit: number, _windowMs: number): boolean {
      calls += 1;
      return calls <= allowCount;
    },
  };
}

const fakeClock: ClockPort = { now: () => new Date('2026-01-01T12:00:00Z') };

const fakeAnthropic: AnthropicPort = {
  async *streamChat() {
    yield 'ok';
  },
};

const BASE_SESSION = '33333333-3333-3333-3333-333333333333';

// ---------------------------------------------------------------------------
// sendMessage rate-limit
// ---------------------------------------------------------------------------

describe('sendMessage — rate limit → 429', () => {
  it('blockAllLimiter → перший виклик вже 429', async () => {
    const result = await sendMessage(
      {
        sessionId: BASE_SESSION,
        userMessage: 'привіт',
        clientHistory: [],
        clientAgeBand: '16-17',
        clientUserName: null,
        ip: '1.2.3.4',
      },
      {
        supabase: null,
        anthropic: fakeAnthropic,
        clock: fakeClock,
        limiter: blockAllLimiter,
      },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
    expect(result.error).toMatch(/too many requests/i);
  });

  it('allowAllLimiter → повертає stream, не 429', async () => {
    const result = await sendMessage(
      {
        sessionId: BASE_SESSION,
        userMessage: 'привіт',
        clientHistory: [],
        clientAgeBand: '16-17',
        clientUserName: null,
        ip: '1.2.3.4',
      },
      {
        supabase: null,
        anthropic: fakeAnthropic,
        clock: fakeClock,
        limiter: allowAllLimiter,
      },
    );
    // У demo-режимі — stream; точно не 429
    expect(result.kind).not.toBe('error');
  });

  it('лімітер що блокує на 2-й allow() виклик → 429 (ip-ліміт вичерпано)', async () => {
    // sendMessage викликає limiter.allow двічі: ip і session.
    // Перший allow → true (ip), другий → false (session) → 429.
    const limiter = makeCountingLimiter(1);
    const result = await sendMessage(
      {
        sessionId: BASE_SESSION,
        userMessage: 'привіт',
        clientHistory: [],
        clientAgeBand: '16-17',
        clientUserName: null,
        ip: '1.2.3.4',
      },
      {
        supabase: null,
        anthropic: fakeAnthropic,
        clock: fakeClock,
        limiter,
      },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// createSession rate-limit
// ---------------------------------------------------------------------------

describe('createSession — rate limit → 429', () => {
  it('blockAllLimiter → 429', async () => {
    const result = await createSession(
      { ageBand: '16-17', ip: '1.2.3.4' },
      { supabase: null, limiter: blockAllLimiter },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
  });

  it('allowAllLimiter → ok', async () => {
    const result = await createSession(
      { ageBand: '16-17', ip: '1.2.3.4' },
      { supabase: null, limiter: allowAllLimiter },
    );
    expect(result.kind).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// deleteSession rate-limit
// ---------------------------------------------------------------------------

describe('deleteSession — rate limit → 429', () => {
  it('blockAllLimiter → 429', async () => {
    const result = await deleteSession(
      { sessionId: BASE_SESSION, ip: '1.2.3.4' },
      { supabase: null, limiter: blockAllLimiter },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
  });

  it('allowAllLimiter + demo-режим → ok', async () => {
    const result = await deleteSession(
      { sessionId: BASE_SESSION, ip: '1.2.3.4' },
      { supabase: null, limiter: allowAllLimiter },
    );
    expect(result.kind).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// getSessionMessages rate-limit
// ---------------------------------------------------------------------------

describe('getSessionMessages — rate limit → 429', () => {
  it('blockAllLimiter → 429', async () => {
    const result = await getSessionMessages(
      { sessionId: BASE_SESSION, ip: '1.2.3.4' },
      { supabase: null, limiter: blockAllLimiter },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
  });

  it('allowAllLimiter + demo-режим → ok з порожнім списком', async () => {
    const result = await getSessionMessages(
      { sessionId: BASE_SESSION, ip: '1.2.3.4' },
      { supabase: null, limiter: allowAllLimiter },
    );
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.messages).toEqual([]);
    expect(result.persisted).toBe(false);
  });
});
