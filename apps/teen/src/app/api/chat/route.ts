// POST /api/chat — тонкий Controller (CQRS-lite, quality-gate §2.1).
// parse → sendMessage handler → серіалізація SSE/JSON.
// Вся логіка в commands/sendMessage.ts.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { hasSessionCookie, verifySessionCookie } from '@/lib/session-token';
import { clientIp } from '@/lib/rate-limit';
import { ChatRequestSchema } from '@ya-ye/contracts';
import { sendMessage, persistAssistantMessage } from '@/server/commands/sendMessage';
import { createAnthropicAdapter } from '@/server/adapters/anthropicSdk';
import { SystemClock } from '@/server/adapters/systemClock';
import { MemoryLimiterAdapter } from '@/server/adapters/memoryLimiter';
import type { ChatTurn } from '@/server/commands/sendMessage';

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
    // Не розкриваємо internals у production (S5 PII).
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function _handlePost(req: Request) {
  // 1. Parse body через ChatRequestSchema (quality-gate §2.4).
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError('invalid request', 400);
  }

  const parsed = ChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'invalid request';
    return jsonError(firstIssue, 400);
  }

  const {
    sessionId,
    userMessage,
    history: rawHistory,
    ageBand: clientAgeBand,
    userName: rawUserName,
  } = parsed.data;

  // Додаткова нормалізація: фільтруємо порожні turns та обмежуємо до 20.
  const clientHistory: ChatTurn[] = rawHistory
    .filter((m) => m.content.trim().length > 0)
    .slice(-20);

  // userName — trim + обрізка до 32 (схема не trim-ить).
  const clientUserName: string | null =
    rawUserName && rawUserName.trim().length > 0 ? rawUserName.trim() : null;

  // 2. 401/403 семантика (S5): немає cookie → 401; cookie є але не ця сесія → 403.
  if (!hasSessionCookie(req)) {
    return jsonError('unauthorized', 401);
  }
  if (!verifySessionCookie(req, sessionId)) {
    return jsonError('forbidden', 403);
  }

  // 3. Ініціалізація адаптерів. Ключ читає фабрика (at request time, BOM-strip).
  const anthropic = createAnthropicAdapter();
  if (!anthropic) {
    console.error('[chat] ANTHROPIC_API_KEY is not set');
    return jsonError('server misconfigured: ANTHROPIC_API_KEY missing', 500);
  }

  const supabase = isSupabaseConfigured() ? createClient() : null;
  const clock = new SystemClock();
  const limiter = new MemoryLimiterAdapter();
  const ip = clientIp(req);

  // 4. Виклик command-handler.
  const result = await sendMessage(
    { sessionId, userMessage, clientHistory, clientAgeBand, clientUserName, ip },
    { supabase, anthropic, clock, limiter },
  );

  if (result.kind === 'error') {
    return jsonError(result.error, result.status);
  }

  if (result.kind === 'crisis') {
    return new Response(JSON.stringify({ type: 'crisis', message: result.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. SSE streaming — байт-в-байт контракт: {type:'token',text}, {type:'done'}, {type:'error'}.
  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of result.tokens) {
          fullResponse += token;
          const sseChunk = `data: ${JSON.stringify({ type: 'token', text: token })}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));
        }

        // Зберігаємо assistant-message після стріму (warn при збої — стрім вже відданий).
        if (supabase) {
          await persistAssistantMessage(supabase, sessionId, fullResponse);
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[chat-stream-error]', msg);
        // Expose error detail only in dev — avoid leaking internals in production (S5).
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
