// queries/getSessionMessages.ts — читання history з БД (CQRS-lite §2.1).
// Тестується без HTTP: приймає deps-об'єкт, повертає plain result.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { RateLimiterPort } from '@/server/ports/rateLimiter';

export type MessageRecord = { role: 'user' | 'assistant'; content: string; created_at: string };

export interface GetSessionMessagesDeps {
  supabase: SupabaseClient | null;
  limiter: RateLimiterPort;
}

export interface GetSessionMessagesParams {
  sessionId: string;
  ip: string;
}

export type GetSessionMessagesResult =
  | { kind: 'ok'; messages: MessageRecord[]; persisted: boolean }
  | { kind: 'error'; status: number; error: string };

export async function getSessionMessages(
  params: GetSessionMessagesParams,
  deps: GetSessionMessagesDeps,
): Promise<GetSessionMessagesResult> {
  const { sessionId, ip } = params;
  const { supabase, limiter } = deps;

  if (!limiter.allow(`messages:${ip}`, 60, 60_000)) {
    return { kind: 'error', status: 429, error: 'too many requests' };
  }

  if (!supabase) {
    return { kind: 'ok', messages: [], persisted: false };
  }

  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(40);

  if (error) {
    console.warn('[getSessionMessages] supabase error:', error.message);
    return { kind: 'ok', messages: [], persisted: false };
  }

  const messages: MessageRecord[] = (data ?? [])
    .filter(
      (m): m is MessageRecord =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        typeof m.created_at === 'string',
    )
    .map((m) => ({ role: m.role, content: m.content, created_at: m.created_at }));

  return { kind: 'ok', messages, persisted: true };
}
