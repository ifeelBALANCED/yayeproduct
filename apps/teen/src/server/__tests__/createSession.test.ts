// S1 unit-тести для commands/createSession.ts (quality-gate §S1).

import { describe, it, expect } from 'vitest';
import { createSession } from '../commands/createSession';
import type { CreateSessionDeps } from '../commands/createSession';
import type { RateLimiterPort } from '../ports/rateLimiter';
import type { SupabaseClient } from '@supabase/supabase-js';

const allowAllLimiter: RateLimiterPort = { allow: () => true };
const blockAllLimiter: RateLimiterPort = { allow: () => false };

describe('createSession — demo-режим', () => {
  const demoDeps: CreateSessionDeps = {
    supabase: null,
    limiter: allowAllLimiter,
  };

  it('повертає ok з UUID і persisted: false', async () => {
    const result = await createSession({ ageBand: '16-17', ip: '1.2.3.4' }, demoDeps);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.persisted).toBe(false);
    expect(result.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('повертає 429 коли лімітер блокує', async () => {
    const result = await createSession(
      { ageBand: '16-17', ip: '1.2.3.4' },
      { ...demoDeps, limiter: blockAllLimiter },
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.status).toBe(429);
  });
});

describe('createSession — persisted-режим', () => {
  it('повертає ok з persisted: true коли БД успішна', async () => {
    const supabase = {
      from: (table: string) => {
        if (table === 'users') {
          return {
            insert: () => ({
              select: () => ({ single: async () => ({ data: { id: 'user-1' }, error: null }) }),
            }),
          };
        }
        if (table === 'sessions') {
          return {
            insert: () => ({
              select: () => ({ single: async () => ({ data: { id: 'sess-1' }, error: null }) }),
            }),
          };
        }
        return {};
      },
    } as unknown as SupabaseClient;

    const result = await createSession(
      { ageBand: '13-15', ip: '1.2.3.4' },
      { supabase, limiter: allowAllLimiter },
    );
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.persisted).toBe(true);
    expect(result.sessionId).toBe('sess-1');
  });

  it('деградує до demo UUID коли user insert падає', async () => {
    const supabase = {
      from: (table: string) => {
        if (table === 'users') {
          return {
            insert: () => ({
              select: () => ({ single: async () => ({ data: null, error: { message: 'fail' } }) }),
            }),
          };
        }
        return {};
      },
    } as unknown as SupabaseClient;

    const result = await createSession(
      { ageBand: '16-17', ip: '1.2.3.4' },
      { supabase, limiter: allowAllLimiter },
    );
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.persisted).toBe(false);
  });
});
