import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@ya-ye/method/system-prompt';
import { detectCrisis } from '@ya-ye/method/crisis-detector';
import { validateAsymmetry } from '@ya-ye/method/principles/asymmetry';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { verifySessionCookie } from '@/lib/session-token';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { ChatRequestSchema } from '@ya-ye/contracts';
import type { SessionContext, AgeBand, Jurisdiction } from '@ya-ye/method/system-prompt';

// Crisis short-circuit message — точно за canonical golden 4.5 + section 4.5
// "Дія: three-move logic, ОДРАЗУ: 1) почула. 2) зачекай, я хочу зробити паузу."
// Третя дія — UI модалка з номерами довіри (не текст моделі).
const CRISIS_MESSAGE = 'стоп. зупинись на секунду.\n\nя хочу щоб ти зараз був не сам з цим.';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

// VALID_AGE_BANDS / VALID_JURISDICTIONS — використовуються для валідації DB-значень
// (не client-input: вхідні поля тепер валідує ChatRequestSchema).
const VALID_AGE_BANDS: readonly AgeBand[] = ['13-15', '16-17', '18-25'] as const;
// DB-колонка jurisdiction — вільний text; HOTLINES індексується цим union,
// тому невалідне значення з БД мусить деградувати до 'UA', а не падати.
const VALID_JURISDICTIONS: readonly Jurisdiction[] = ['UA', 'US', 'UK', 'EU'] as const;

// Результат server-side lookup сесії: БД — джерело істини для age_band,
// jurisdiction і started_at (P0-3); клієнтські значення — лише demo-fallback.
type SessionFacts = {
  userId: string | null;
  ageBand: AgeBand | null;
  jurisdiction: Jurisdiction | null;
  startedAtMs: number | null;
};

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    return await _handlePost(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat-top-level-error]', msg);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function _handlePost(req: Request) {
  // Parse body через ChatRequestSchema (quality-gate §2.4).
  // §2.4: turnNumber / sessionStartedAt / postCrisisMode — серверні поля,
  // з клієнта НЕ приймаються; схема .strict() відхилить їх із 400.
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'invalid request';
    return new Response(JSON.stringify({ error: firstIssue }), { status: 400 });
  }

  const {
    sessionId,
    userMessage,
    history: rawHistory,
    ageBand: clientAgeBand,
    userName: rawUserName,
  } = parsed.data;

  // Додаткова нормалізація: фільтруємо порожні turns та обмежуємо sliding window до 20.
  // Схема вже гарантує max 40 і max 2000 символів на turn.
  const clientHistory: ChatTurn[] = rawHistory
    .filter((m) => m.content.trim().length > 0)
    .slice(-20);

  // userName — trim + обрізка до 32 (схема не trim-ить)
  const clientUserName: string | null =
    rawUserName && rawUserName.trim().length > 0 ? rawUserName.trim() : null;

  // §2.4: turnNumber падає back до підрахунку user-turns у history (нижче).
  // §2.4: sessionStartedAt — сервер є джерелом істини; elapsed = 0 коли немає
  // DB-факту (якість-gate §2.4 вимагає сервер, а не клієнт, визначав elapsed).
  const clientTurnNumber: number | null = null;
  // §2.4: postCrisisMode — серверне поле; не приймається з клієнта.
  // У поточній фазі завжди false (postCrisis-стан буде read із DB у Phase 2).
  const clientPostCrisisMode = false;
  // §2.4: sessionStartedAt — не приймається з клієнта (doc виграє над demo-convenience).
  // elapsed = 0 коли немає DB-started_at; сесія-таймер UI незалежний від цього.
  const clientSessionStartedAt: number | null = null;

  // P0-5: підтвердження володіння сесією — HMAC-cookie, виданий /api/sessions.
  // Без нього будь-хто зі знанням UUID писав би в чужу сесію (IDOR).
  if (!verifySessionCookie(req, sessionId)) {
    return jsonError('forbidden', 403);
  }

  // P0-5: rate limit — кожен виклик коштує грошей (Anthropic API).
  const ip = clientIp(req);
  if (
    !rateLimit(`chat:ip:${ip}`, 20, 60_000) ||
    !rateLimit(`chat:session:${sessionId}`, 15, 60_000)
  ) {
    return jsonError('too many requests', 429);
  }

  // Lazy-init Anthropic client — read env at request time, not module load.
  // NOTE: an empty ANTHROPIC_API_KEY in the shell env will shadow .env.local
  // (Next.js never overrides pre-existing process env vars). Treat "" as unset.
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^﻿/, '').trim();
  if (!apiKey) {
    console.error('[chat] ANTHROPIC_API_KEY is not set');
    return new Response(
      JSON.stringify({ error: 'server misconfigured: ANTHROPIC_API_KEY missing' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const anthropic = new Anthropic({ apiKey });

  const supabase = isSupabaseConfigured() ? createClient() : null;

  // Server-side факти сесії (P0-3): age_band/jurisdiction/started_at читаються
  // з БД, а не з клієнта. Demo-режим (без Supabase) — fallback на валідовані
  // клієнтські значення нижче.
  const facts: SessionFacts = {
    userId: null,
    ageBand: null,
    jurisdiction: null,
    startedAtMs: null,
  };
  if (supabase) {
    type SessionRow = {
      user_id: string | null;
      started_at: string | null;
      users:
        | { age_band: string | null; jurisdiction: string | null }
        | Array<{ age_band: string | null; jurisdiction: string | null }>
        | null;
    };
    const { data, error } = await supabase
      .from('sessions')
      .select('user_id, started_at, users ( age_band, jurisdiction )')
      .eq('id', sessionId)
      .maybeSingle();
    if (error) {
      // Транзієнтний збій БД не повинен валити чат — деградуємо до demo-поведінки
      console.warn('[chat] session lookup failed:', error.message);
    } else if (!data) {
      // Сесія не існує — не пишемо повідомлення/кризові евенти в неіснуючі FK
      return jsonError('unknown session', 404);
    } else {
      const row = data as SessionRow;
      const user = Array.isArray(row.users) ? (row.users[0] ?? null) : row.users;
      facts.userId = row.user_id;
      facts.ageBand =
        user && (VALID_AGE_BANDS as readonly string[]).includes(user.age_band ?? '')
          ? (user.age_band as AgeBand)
          : null;
      facts.jurisdiction =
        user && (VALID_JURISDICTIONS as readonly string[]).includes(user.jurisdiction ?? '')
          ? (user.jurisdiction as Jurisdiction)
          : null;
      const parsed = row.started_at ? Date.parse(row.started_at) : NaN;
      facts.startedAtMs = Number.isNaN(parsed) ? null : parsed;
    }
  }

  // 1. Crisis detection — current message first, then scan recent history to preserve context.
  // "справді" alone doesn't trip the detector, but when it follows a crisis confirmation question
  // the session is still in crisis. Scan the last 4 user messages and use the highest level seen.
  const crisis = detectCrisis(userMessage);
  const recentUserMessages = Array.isArray(clientHistory)
    ? clientHistory
        .filter((m) => m.role === 'user')
        .slice(-4)
        .map((m) => m.content)
    : [];
  const historyCrisisLevel = recentUserMessages.reduce<string>((worst, msg) => {
    const r = detectCrisis(msg);
    const rank: Record<string, number> = { none: 0, elevated: 1, high: 2, imminent: 3 };
    return (rank[r.severity] ?? 0) > (rank[worst] ?? 0) ? r.severity : worst;
  }, 'none');
  // Sticky: if history had elevated/high and current is none, keep history level as elevated.
  // We downgrade history contribution by one level so a single old message doesn't perpetually
  // block the session, but we do preserve awareness.
  const stickyLevel: Record<string, string> = {
    none: 'none',
    elevated: 'elevated',
    high: 'elevated',
    imminent: 'elevated',
  };
  const effectiveCrisisLevel =
    crisis.severity !== 'none'
      ? crisis.severity
      : ((stickyLevel[historyCrisisLevel] ?? 'none') as typeof crisis.severity);

  // 2. Save user message FIRST — його id потрібен для crisis_events.trigger_message_id
  let userMessageId: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: userMessage,
        prompt_version: process.env.ANTHROPIC_PROMPT_VERSION ?? 'v1.8',
      })
      .select('id')
      .single();
    if (error) console.warn('[msg-save-user]', error.message);
    else userMessageId = (data as { id: string } | null)?.id ?? null;
  }

  // 3. Log crisis event — колонки точно за схемою migration 001 (P0-1):
  // trigger_text/detected_at у таблиці НЕ існують, jurisdiction — NOT NULL.
  // Текст тригера доступний через trigger_message_id → messages.content.
  if (effectiveCrisisLevel !== 'none' && supabase) {
    const { error } = await supabase.from('crisis_events').insert({
      session_id: sessionId,
      user_id: facts.userId,
      trigger_message_id: userMessageId,
      severity: effectiveCrisisLevel,
      detection_method: 'keyword_v1',
      jurisdiction: facts.jurisdiction ?? 'UA',
    });
    // Safety-критичний запис: помилка не ковтається тихо (quality-gate S2-інваріант)
    if (error) console.error('[crisis-log] insert FAILED:', error.message, { sessionId });
  }

  // 4. High/imminent crisis → return JSON signal, skip streaming
  if (crisis.severity === 'high' || crisis.severity === 'imminent') {
    return new Response(JSON.stringify({ type: 'crisis', message: CRISIS_MESSAGE }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Build the message array for Anthropic from the client-sent history.
  // Anthropic requires the array to START with a user turn and alternate — so
  // strip any leading assistant turns (e.g. the client-only opening greeting).
  const messages: ChatTurn[] = [...clientHistory];
  while (messages.length > 0 && messages[0]!.role !== 'user') {
    messages.shift();
  }

  // Ensure the current user message is the final entry (append unless already last).
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  // turnNumber drives the turn-1 EU AI Act disclosure rule.
  // §2.4: clientTurnNumber завжди null (серверне поле) — рахуємо user-turns у history.
  const userTurnCount = clientTurnNumber ?? messages.filter((m) => m.role === 'user').length;

  // 6. Build session context
  const now = Date.now();
  // P0-3: started_at з БД виграє; клієнтський timestamp — лише demo-fallback.
  // Clamp 0..60 хв: клієнт не може форсувати session-end правила (4.8/4.9)
  // абсурдним значенням. null = перше повідомлення, elapsed = 0.
  const sessionStartedAt = facts.startedAtMs ?? clientSessionStartedAt ?? null;
  const elapsedMin = sessionStartedAt
    ? Math.min(60, Math.max(0, Math.floor((now - sessionStartedAt) / 60000)))
    : 0;

  const ctx: SessionContext = {
    // P0-3: age_band з users-таблиці (онбординг); demo-fallback — валідований
    // клієнтський enum; останній резерв — '16-17' (середня група).
    ageBand: facts.ageBand ?? clientAgeBand ?? '16-17',
    locale: 'uk',
    jurisdiction: facts.jurisdiction ?? 'UA',
    sessionStartTime: new Date(sessionStartedAt ?? now),
    elapsedMin,
    turnNumber: userTurnCount,
    themeChosen: null,
    currentMode: 1,
    fmDominant: null,
    modesSequence: [],
    companionshipDriftDetected: false,
    // Визначаємо чи вправа вже пропонувалась — по маркерах в history
    // В кризі скидаємо прапор — заземлення завжди дозволено для де-ескалації
    exerciseOfferedInSession:
      effectiveCrisisLevel === 'none'
        ? clientHistory.some(
            (m) =>
              m.role === 'assistant' &&
              /\[(ВПРАВА|ЗАЗЕМЛЕННЯ|ТІЛО|RAIN|КОМПАС|ЯКІР)/.test(m.content),
          )
        : false,
    crisisLevel: effectiveCrisisLevel as typeof crisis.severity,
    hotlinesShown: [],
    userName: clientUserName,
    postCrisisMode: clientPostCrisisMode,
  };

  const systemPrompt = buildSystemPrompt(ctx);

  // 7. Stream from Anthropic
  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: (process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7').replace(/^﻿/, '').trim(),
          max_tokens: 512,
          system: systemPrompt.system,
          messages,
        });

        for await (const event of anthropicStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const token = event.delta.text;
            fullResponse += token;
            const sseChunk = `data: ${JSON.stringify({ type: 'token', text: token })}\n\n`;
            controller.enqueue(encoder.encode(sseChunk));
          }
        }

        // 8. Post-stream asymmetry check — log violations but don't block
        const asymmetryResult = validateAsymmetry(fullResponse);
        if (!asymmetryResult.valid) {
          console.warn('[asymmetry-violation]', asymmetryResult.matches, { sessionId });
        }

        // 9. Save assistant message
        if (supabase) {
          const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullResponse,
            prompt_version: process.env.ANTHROPIC_PROMPT_VERSION ?? 'v1.8',
          });
          if (error) console.warn('[msg-save-assistant]', error.message);
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[chat-stream-error]', msg);
        // Expose error detail only in dev — avoid leaking internals in production
        const payload =
          process.env.NODE_ENV === 'production'
            ? { type: 'error' }
            : { type: 'error', detail: msg };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
