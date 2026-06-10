import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@ya-ye/method/system-prompt';
import { detectCrisis } from '@ya-ye/method/crisis-detector';
import { validateAsymmetry } from '@ya-ye/method/principles/asymmetry';
import { createClient } from '@/lib/supabase/server';
import type { SessionContext } from '@ya-ye/method/system-prompt';

// Crisis short-circuit message — точно за canonical golden 4.5 + section 4.5
// "Дія: three-move logic, ОДРАЗУ: 1) почула. 2) зачекай, я хочу зробити паузу."
// Третя дія — UI модалка з номерами довіри (не текст моделі).
const CRISIS_MESSAGE = 'стоп. зупинись на секунду.\n\nя хочу щоб ти зараз був не сам з цим.';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

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
  // Parse body — guard against empty / malformed JSON before any logic
  let sessionId: string;
  let userMessage: string;
  let clientHistory: ChatTurn[];
  let clientTurnNumber: number | null;
  let clientSessionStartedAt: number | null;
  let clientUserName: string | null;
  let clientPostCrisisMode: boolean;
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      userMessage?: string;
      history?: unknown;
      turnNumber?: unknown;
      sessionStartedAt?: unknown;
      userName?: unknown;
      postCrisisMode?: unknown;
    };
    sessionId = body.sessionId ?? '';
    userMessage = body.userMessage ?? '';
    // History is sent from the client (React state) so the dialogue stays
    // continuous even before Supabase persistence is wired up. Sanitize it.
    clientHistory = Array.isArray(body.history)
      ? body.history
          .filter(
            (m): m is ChatTurn =>
              !!m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              m.content.trim().length > 0,
          )
          .slice(-20)
      : [];
    clientTurnNumber =
      typeof body.turnNumber === 'number' && body.turnNumber > 0
        ? Math.floor(body.turnNumber)
        : null;
    // sessionStartedAt drives elapsedMin → activates session-end turn rules (4.8/4.9).
    // Client-supplied timestamp is fine for MVP (no security implications).
    clientSessionStartedAt =
      typeof body.sessionStartedAt === 'number' && body.sessionStartedAt > 0
        ? body.sessionStartedAt
        : null;
    clientUserName =
      typeof body.userName === 'string' && body.userName.trim().length > 0
        ? body.userName.trim().slice(0, 32)
        : null;
    clientPostCrisisMode = body.postCrisisMode === true;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }

  if (!sessionId || !userMessage.trim()) {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
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

  const supabase = createClient();

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
  const stickyLevel: Record<string, string> = { none: 'none', elevated: 'elevated', high: 'elevated', imminent: 'elevated' };
  const effectiveCrisisLevel =
    crisis.severity !== 'none'
      ? crisis.severity
      : (stickyLevel[historyCrisisLevel] ?? 'none') as typeof crisis.severity;

  // 2. Log crisis event if elevated or higher (non-blocking — DB may not be configured in dev)
  if (effectiveCrisisLevel !== 'none') {
    await supabase.from('crisis_events').insert({
      session_id: sessionId,
      severity: effectiveCrisisLevel,
      trigger_text: userMessage.slice(0, 500),
      detected_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.warn('[crisis-log]', error.message); });
  }

  // 3. Save user message (non-blocking)
  await supabase.from('messages').insert({
    session_id: sessionId,
    role: 'user',
    content: userMessage,
    prompt_version: process.env.ANTHROPIC_PROMPT_VERSION ?? 'v1.8',
  }).then(({ error }) => { if (error) console.warn('[msg-save-user]', error.message); });

  // 4. High/imminent crisis → return JSON signal, skip streaming
  if (crisis.severity === 'high' || crisis.severity === 'imminent') {
    return new Response(
      JSON.stringify({ type: 'crisis', message: CRISIS_MESSAGE }),
      { headers: { 'Content-Type': 'application/json' } },
    );
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

  // turnNumber drives the turn-1 EU AI Act disclosure rule. Prefer the client's
  // value; fall back to counting user turns in the assembled array.
  const userTurnCount = clientTurnNumber ?? messages.filter((m) => m.role === 'user').length;

  // 6. Build session context
  const now = Date.now();
  // null означає: перше повідомлення або таймер ще не почато — elapsed = 0
  const sessionStartedAt = clientSessionStartedAt ?? null;
  const elapsedMin = sessionStartedAt
    ? Math.max(0, Math.floor((now - sessionStartedAt) / 60000))
    : 0;

  const ctx: SessionContext = {
    ageBand: '16-17',
    locale: 'uk',
    jurisdiction: 'UA',
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
    exerciseOfferedInSession: effectiveCrisisLevel === 'none'
      ? clientHistory.some(
          (m) => m.role === 'assistant' && /\[(ВПРАВА|ЗАЗЕМЛЕННЯ|ТІЛО|RAIN|КОМПАС|ЯКІР)/.test(m.content),
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
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
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

        // 9. Save assistant message (non-blocking)
        await supabase.from('messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: fullResponse,
          prompt_version: process.env.ANTHROPIC_PROMPT_VERSION ?? 'v1.8',
        }).then(({ error }) => { if (error) console.warn('[msg-save-assistant]', error.message); });

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
