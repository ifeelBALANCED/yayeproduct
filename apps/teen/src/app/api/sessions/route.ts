// POST /api/sessions — створює анонімного user + session у Supabase.
// Якщо Supabase ще не сконфігурований (.env.local з плейсхолдерами) — повертає
// fresh client-style UUID, щоб демо не ламалось до підключення реальної БД.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { buildSessionCookie } from '@/lib/session-token';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { SessionsCreateRequestSchema } from '@ya-ye/contracts';
import type { AgeBand } from '@ya-ye/method/system-prompt';

// 201 + httpOnly HMAC-cookie володіння сесією (P0-5): лише власник cookie
// зможе писати в /api/chat і читати /api/sessions/[id]/messages.
function sessionResponse(sessionId: string, persisted: boolean): Response {
  const cookie = buildSessionCookie(sessionId);
  if (!cookie) {
    // Fail closed: без SESSION_TOKEN_SECRET у production сесія була б мертвою
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
  if (!rateLimit(`sessions:${clientIp(req)}`, 10, 60_000)) {
    return new Response(JSON.stringify({ error: 'too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse body через SessionsCreateRequestSchema (quality-gate §2.4)
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

  // Fallback path — Supabase ще не сконфігурований. Демо-флоу і так працює
  // (client-state utrymują історію розмови), лише без DB-аудиту.
  if (!isSupabaseConfigured()) {
    return sessionResponse(crypto.randomUUID(), false);
  }

  const supabase = createClient();

  // 1. Створюємо анонімний user-row. RLS обходимо service_role-ключем
  //    (службова операція з route handler).
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
    console.error('[sessions] user insert failed:', userErr?.message);
    // Fallback на UUID — користувач не повинен бачити збій DB
    return sessionResponse(crypto.randomUUID(), false);
  }

  // 2. Створюємо session-row, прив'язаний до user
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, theme: null })
    .select('id')
    .single();

  if (sessErr || !session) {
    console.error('[sessions] session insert failed:', sessErr?.message);
    return sessionResponse(crypto.randomUUID(), false);
  }

  return sessionResponse(session.id, true);
}
