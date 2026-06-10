// POST /api/sessions — тонкий Controller (CQRS-lite, quality-gate §2.1).
// parse → createSession handler → серіалізація.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { buildSessionCookie } from '@/lib/session-token';
import { clientIp } from '@/lib/rate-limit';
import { SessionsCreateRequestSchema } from '@ya-ye/contracts';
import { createSession } from '@/server/commands/createSession';
import { MemoryLimiterAdapter } from '@/server/adapters/memoryLimiter';
import type { AgeBand } from '@ya-ye/method/system-prompt';

function sessionResponse(sessionId: string, persisted: boolean): Response {
  const cookie = buildSessionCookie(sessionId);
  if (!cookie) {
    console.error('[sessions] SESSION_TOKEN_SECRET is not set');
    return new Response(JSON.stringify({ error: 'server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ sessionId, persisted }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
  });
}

export async function POST(req: Request) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = SessionsCreateRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'invalid request';
    return new Response(JSON.stringify({ error: firstIssue }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ageBand = parsed.data.age_band as AgeBand;
  const supabase = isSupabaseConfigured() ? createClient() : null;
  const limiter = new MemoryLimiterAdapter();
  const ip = clientIp(req);

  const result = await createSession({ ageBand, ip }, { supabase, limiter });

  if (result.kind === 'error') {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return sessionResponse(result.sessionId, result.persisted);
}
