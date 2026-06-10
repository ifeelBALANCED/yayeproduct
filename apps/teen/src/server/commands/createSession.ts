// commands/createSession.ts — створення анонімного user + session (CQRS-lite §2.1).
// Тестується без HTTP: приймає deps-об'єкт, повертає plain result.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgeBand } from '@ya-ye/method/system-prompt';
import type { RateLimiterPort } from '@/server/ports/rateLimiter';

export interface CreateSessionDeps {
  // null коли Supabase не сконфігурований (demo-режим)
  supabase: SupabaseClient | null;
  limiter: RateLimiterPort;
}

export interface CreateSessionParams {
  ageBand: AgeBand;
  ip: string;
}

export type CreateSessionResult =
  | { kind: 'ok'; sessionId: string; persisted: boolean }
  | { kind: 'error'; status: number; error: string };

export async function createSession(
  params: CreateSessionParams,
  deps: CreateSessionDeps,
): Promise<CreateSessionResult> {
  const { ageBand, ip } = params;
  const { supabase, limiter } = deps;

  if (!limiter.allow(`sessions:${ip}`, 10, 60_000)) {
    return { kind: 'error', status: 429, error: 'too many requests' };
  }

  // Demo-режим: Supabase ще не сконфігурований.
  if (!supabase) {
    return { kind: 'ok', sessionId: crypto.randomUUID(), persisted: false };
  }

  // 1. Створюємо анонімний user-row.
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      age_band: ageBand,
      locale: 'uk',
      jurisdiction: 'UA',
      parental_consent_status: ageBand === '13-15' ? 'pending' : 'na',
    })
    .select('id')
    .single();

  if (userErr || !user) {
    console.error('[createSession] user insert failed:', userErr?.message);
    return { kind: 'ok', sessionId: crypto.randomUUID(), persisted: false };
  }

  // 2. Створюємо session-row, прив'язаний до user.
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .insert({ user_id: (user as { id: string }).id, theme: null })
    .select('id')
    .single();

  if (sessErr || !session) {
    console.error('[createSession] session insert failed:', sessErr?.message);
    return { kind: 'ok', sessionId: crypto.randomUUID(), persisted: false };
  }

  return { kind: 'ok', sessionId: (session as { id: string }).id, persisted: true };
}
