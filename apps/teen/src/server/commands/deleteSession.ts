// commands/deleteSession.ts — GDPR right-to-erasure (S5, quality-gate §S5).
// Видаляє session-row; каскад у БД прибирає messages + crisis_events.
// User-row НЕ видаляється: на ньому можуть висіти інші сесії.
// Кавеат: видалення user потребує окремого GDPR-endpoint (борг Phase 4).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { RateLimiterPort } from '@/server/ports/rateLimiter';

export interface DeleteSessionDeps {
  supabase: SupabaseClient | null;
  limiter: RateLimiterPort;
}

export interface DeleteSessionParams {
  sessionId: string;
  ip: string;
}

export type DeleteSessionResult = { kind: 'ok' } | { kind: 'error'; status: number; error: string };

export async function deleteSession(
  params: DeleteSessionParams,
  deps: DeleteSessionDeps,
): Promise<DeleteSessionResult> {
  const { sessionId, ip } = params;
  const { supabase, limiter } = deps;

  if (!limiter.allow(`delete-session:${ip}`, 10, 60_000)) {
    return { kind: 'error', status: 429, error: 'too many requests' };
  }

  // Demo-режим: БД відсутня, нічого не видаляємо — 204.
  if (!supabase) {
    return { kind: 'ok' };
  }

  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);

  if (error) {
    console.error('[deleteSession] delete failed:', error.message, { sessionId });
    return { kind: 'error', status: 500, error: 'internal' };
  }

  return { kind: 'ok' };
}
