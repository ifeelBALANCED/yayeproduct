// DELETE /api/sessions/[id] — GDPR right-to-erasure (S5, quality-gate §S5).
// 401/403 → rate limit → deleteSession command → 204.
//
// Каскад: БД видаляє messages + crisis_events разом з session-row.
// User-row НЕ видаляємо — на ньому можуть висіти інші сесії.
// Повне видалення user — окремий GDPR-endpoint, борг Phase 4.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { hasSessionCookie, verifySessionCookie } from '@/lib/session-token';
import { clientIp } from '@/lib/rate-limit';
import { deleteSession } from '@/server/commands/deleteSession';
import { MemoryLimiterAdapter } from '@/server/adapters/memoryLimiter';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  if (!sessionId || !UUID_RE.test(sessionId)) {
    return new Response(JSON.stringify({ error: 'missing session id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // S5 401/403 семантика: немає cookie → 401; cookie є але не ця сесія → 403.
  if (!hasSessionCookie(req)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!verifySessionCookie(req, sessionId)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = isSupabaseConfigured() ? createClient() : null;
  const limiter = new MemoryLimiterAdapter();
  const ip = clientIp(req);

  const result = await deleteSession({ sessionId, ip }, { supabase, limiter });

  if (result.kind === 'error') {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 204 No Content — стандарт для успішного DELETE.
  return new Response(null, { status: 204 });
}
