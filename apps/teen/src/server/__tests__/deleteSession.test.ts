// S1 unit-тести для commands/deleteSession.ts (GDPR, quality-gate §S5).

import { describe, it, expect } from 'vitest';
import { deleteSession } from '../commands/deleteSession';
import type { DeleteSessionDeps } from '../commands/deleteSession';
import type { RateLimiterPort } from '../ports/rateLimiter';
import type { SupabaseClient } from '@supabase/supabase-js';

const allowAllLimiter: RateLimiterPort = { allow: () => true };
const blockAllLimiter: RateLimiterPort = { allow: () => false };

const sessionId = '22222222-2222-2222-2222-222222222222';

describe('deleteSession — demo-режим', () => {
  const demoDeps: DeleteSessionDeps = {
    supabase: null,
    limiter: allowAllLimiter,
  };

  it('повертає ok без дії в demo-режимі (204)', async () => {
    const result = await deleteSession({ sessionId, ip: '1.2.3.4' }, demoDeps);
    expect(result.kind).toBe('ok');
  });

  it('повертає 429 коли лімітер блокує', async () => {
    const result = await deleteSession(
      { sessionId, ip: '1.2.3.4' },
      { ...demoDeps, limiter: blockAllLimiter },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
  });
});

describe('deleteSession — persisted-режим', () => {
  it('повертає ok коли delete успішний', async () => {
    const supabase = {
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    } as unknown as SupabaseClient;

    const result = await deleteSession(
      { sessionId, ip: '1.2.3.4' },
      {
        supabase,
        limiter: allowAllLimiter,
      },
    );
    expect(result.kind).toBe('ok');
  });

  it('повертає 500 коли delete падає', async () => {
    const supabase = {
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: { message: 'DB fail' } }) }),
      }),
    } as unknown as SupabaseClient;

    const result = await deleteSession(
      { sessionId, ip: '1.2.3.4' },
      {
        supabase,
        limiter: allowAllLimiter,
      },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(500);
  });
});
