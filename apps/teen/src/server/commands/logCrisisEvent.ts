// commands/logCrisisEvent.ts — explicit crisis-log command (CQRS-lite §2.1).
// Викликається з commands/sendMessage.ts (крок 3, S2-інваріант).
// S2-інваріант: крах → повертає error, не ковтає тихо.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Jurisdiction } from '@ya-ye/method/system-prompt';

interface LogCrisisEventDeps {
  supabase: SupabaseClient | null;
}

interface LogCrisisEventParams {
  sessionId: string;
  userId: string | null;
  triggerMessageId: string | null;
  severity: 'elevated' | 'high' | 'imminent';
  jurisdiction: Jurisdiction;
}

type LogCrisisEventResult =
  | { kind: 'ok'; eventId: string }
  | { kind: 'error'; status: number; error: string };

export async function logCrisisEvent(
  params: LogCrisisEventParams,
  deps: LogCrisisEventDeps,
): Promise<LogCrisisEventResult> {
  const { supabase } = deps;

  // Demo-режим: БД відсутня, crisis не персистується.
  if (!supabase) {
    return { kind: 'error', status: 503, error: 'database not configured' };
  }

  const { data, error } = await supabase
    .from('crisis_events')
    .insert({
      session_id: params.sessionId,
      user_id: params.userId,
      trigger_message_id: params.triggerMessageId,
      severity: params.severity,
      detection_method: 'keyword_v1',
      jurisdiction: params.jurisdiction,
    })
    .select('id')
    .single();

  if (error || !data) {
    // S2-інваріант: safety-критичний запис не може бути втрачений тихо.
    console.error('[logCrisisEvent] insert FAILED:', error?.message, {
      sessionId: params.sessionId,
    });
    return { kind: 'error', status: 500, error: 'storage failed' };
  }

  return { kind: 'ok', eventId: (data as { id: string }).id };
}
