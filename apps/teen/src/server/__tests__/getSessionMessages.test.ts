// S1 unit-тести для queries/getSessionMessages.ts (quality-gate §S1).

import { describe, it, expect } from 'vitest';
import { getSessionMessages } from '../queries/getSessionMessages';
import type { GetSessionMessagesDeps } from '../queries/getSessionMessages';
import type { RateLimiterPort } from '../ports/rateLimiter';
import type { SupabaseClient } from '@supabase/supabase-js';

const allowAllLimiter: RateLimiterPort = { allow: () => true };
const blockAllLimiter: RateLimiterPort = { allow: () => false };

const sessionId = '33333333-3333-3333-3333-333333333333';

describe('getSessionMessages — demo-режим', () => {
  const demoDeps: GetSessionMessagesDeps = {
    supabase: null,
    limiter: allowAllLimiter,
  };

  it('повертає порожній масив і persisted: false', async () => {
    const result = await getSessionMessages({ sessionId, ip: '1.2.3.4' }, demoDeps);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.messages).toEqual([]);
    expect(result.persisted).toBe(false);
  });

  it('повертає 429 коли лімітер блокує', async () => {
    const result = await getSessionMessages(
      { sessionId, ip: '1.2.3.4' },
      { ...demoDeps, limiter: blockAllLimiter },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
  });
});

describe('getSessionMessages — persisted-режим', () => {
  it('повертає повідомлення з БД', async () => {
    const dbMessages = [
      { role: 'user', content: 'привіт', created_at: '2026-01-01T00:00:00Z' },
      { role: 'assistant', content: 'я тут', created_at: '2026-01-01T00:00:01Z' },
    ];

    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: dbMessages, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getSessionMessages(
      { sessionId, ip: '1.2.3.4' },
      {
        supabase,
        limiter: allowAllLimiter,
      },
    );
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]?.role).toBe('user');
    expect(result.persisted).toBe(true);
  });

  it('фільтрує некоректні ролі з БД', async () => {
    const dbMessages = [
      { role: 'user', content: 'ok', created_at: '2026-01-01T00:00:00Z' },
      { role: 'system', content: 'invalid', created_at: '2026-01-01T00:00:01Z' },
    ];

    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: dbMessages, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getSessionMessages(
      { sessionId, ip: '1.2.3.4' },
      {
        supabase,
        limiter: allowAllLimiter,
      },
    );
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    // 'system' має бути відфільтрований
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.role).toBe('user');
  });

  it('деградує до порожнього масиву при збої БД', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: null, error: { message: 'DB fail' } }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getSessionMessages(
      { sessionId, ip: '1.2.3.4' },
      {
        supabase,
        limiter: allowAllLimiter,
      },
    );
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.messages).toEqual([]);
    expect(result.persisted).toBe(false);
  });
});
