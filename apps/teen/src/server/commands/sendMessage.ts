// commands/sendMessage.ts — обробник чату (CQRS-lite, quality-gate §2.1).
// Приймає deps-об'єкт з портами — тестується без HTTP і без реальних адаптерів.
// Crisis-логіку перенесено ДОСЛІВНО з api/chat/route.ts — методологічна рамка,
// жодних покращень без апруву Methodology Lead.

import { buildSystemPrompt } from '@ya-ye/method/system-prompt';
import { detectCrisis } from '@ya-ye/method/crisis-detector';
import { validateAsymmetry } from '@ya-ye/method/principles/asymmetry';
import { logCrisisEvent } from './logCrisisEvent';
import type { SessionContext, AgeBand, Jurisdiction } from '@ya-ye/method/system-prompt';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnthropicPort } from '@/server/ports/anthropic';
import type { ClockPort } from '@/server/ports/clock';
import type { RateLimiterPort } from '@/server/ports/rateLimiter';

// Crisis short-circuit message — точно за canonical golden 4.5 + section 4.5
// "Дія: three-move logic, ОДРАЗУ: 1) почула. 2) зачекай, я хочу зробити паузу."
// Третя дія — UI модалка з номерами довіри (не текст моделі).
const CRISIS_MESSAGE = 'стоп. зупинись на секунду.\n\nя хочу щоб ти зараз був не сам з цим.';

// VALID_AGE_BANDS / VALID_JURISDICTIONS — для валідації DB-значень (не client-input).
const VALID_AGE_BANDS: readonly AgeBand[] = ['13-15', '16-17', '18-25'] as const;
const VALID_JURISDICTIONS: readonly Jurisdiction[] = ['UA', 'US', 'UK', 'EU'] as const;

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

// S2-інваріант (quality-gate §S2): результат операції вставки з чіткою семантикою.
export type SendMessageResult =
  | { kind: 'crisis'; message: string }
  | { kind: 'stream'; tokens: AsyncIterable<string> }
  | { kind: 'error'; status: number; error: string };

export interface SendMessageDeps {
  // null коли Supabase не сконфігурований (demo-режим)
  supabase: SupabaseClient | null;
  anthropic: AnthropicPort;
  clock: ClockPort;
  limiter: RateLimiterPort;
}

export interface SendMessageParams {
  sessionId: string;
  userMessage: string;
  // clientHistory: demo-режим — єдине джерело; persisted-режим — ігнорується
  // (свідомий demo-виняток: §S5 prompt-injection, документовано нижче).
  clientHistory: ChatTurn[];
  clientAgeBand: AgeBand | null | undefined;
  clientUserName: string | null;
  ip: string;
}

// Результат server-side lookup сесії.
type SessionFacts = {
  userId: string | null;
  ageBand: AgeBand | null;
  jurisdiction: Jurisdiction | null;
  startedAtMs: number | null;
};

type SessionRow = {
  user_id: string | null;
  started_at: string | null;
  users:
    | { age_band: string | null; jurisdiction: string | null }
    | Array<{ age_band: string | null; jurisdiction: string | null }>
    | null;
};

export async function sendMessage(
  params: SendMessageParams,
  deps: SendMessageDeps,
): Promise<SendMessageResult> {
  const { sessionId, userMessage, clientHistory, clientAgeBand, clientUserName, ip } = params;
  const { supabase, anthropic, clock, limiter } = deps;

  // Rate limit — кожен виклик коштує грошей (Anthropic API).
  if (
    !limiter.allow(`chat:ip:${ip}`, 20, 60_000) ||
    !limiter.allow(`chat:session:${sessionId}`, 15, 60_000)
  ) {
    return { kind: 'error', status: 429, error: 'too many requests' };
  }

  // Server-side факти сесії (P0-3): age_band/jurisdiction/started_at читаються
  // з БД, а не з клієнта. Demo-режим (без Supabase) — fallback на валідовані
  // клієнтські значення нижче.
  const facts: SessionFacts = {
    userId: null,
    ageBand: null,
    jurisdiction: null,
    startedAtMs: null,
  };

  // Persisted-режим: читаємо повну history з БД (S5: prompt-injection захист).
  // DEMO-ВИНЯТОК: коли supabase === null, clientHistory є єдиним джерелом — це
  // свідомий компроміс для demo-флоу. DB-режим = продакшен-шлях без винятків.
  let dbHistory: ChatTurn[] = [];

  if (supabase) {
    // Lookup сесії
    const { data, error } = await supabase
      .from('sessions')
      .select('user_id, started_at, users ( age_band, jurisdiction )')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      // Транзієнтний збій БД — не падаємо, деградуємо до demo
      console.warn('[sendMessage] session lookup failed:', error.message);
    } else if (!data) {
      return { kind: 'error', status: 404, error: 'unknown session' };
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
      const parsedMs = row.started_at ? Date.parse(row.started_at) : NaN;
      facts.startedAtMs = Number.isNaN(parsedMs) ? null : parsedMs;
    }

    // S5: читаємо останні 20 turns з БД — ігноруємо clientHistory у persisted-режимі.
    // Клієнт НЕ може інжектити assistant-репліки у history (prompt-injection).
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (msgError) {
      console.warn('[sendMessage] messages lookup failed:', msgError.message);
      // Продовжуємо з порожньою history — краще ніж 500
    } else {
      dbHistory = (msgData ?? [])
        .filter(
          (m): m is ChatTurn =>
            !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
        )
        .map((m) => ({ role: m.role, content: m.content }));
    }
  }

  // Ефективна history для crisis-detection і побудови messages[]:
  // persisted = DB-history; demo = clientHistory (свідомий виняток).
  const effectiveHistory: ChatTurn[] = supabase ? dbHistory : clientHistory;

  // 1. Crisis detection — поточне повідомлення + останні 4 user-turns (sticky).
  const crisis = detectCrisis(userMessage);
  const recentUserMessages = effectiveHistory
    .filter((m) => m.role === 'user')
    .slice(-4)
    .map((m) => m.content);

  const historyCrisisLevel = recentUserMessages.reduce<string>((worst, msg) => {
    const r = detectCrisis(msg);
    const rank: Record<string, number> = { none: 0, elevated: 1, high: 2, imminent: 3 };
    return (rank[r.severity] ?? 0) > (rank[worst] ?? 0) ? r.severity : worst;
  }, 'none');

  // Sticky: якщо history мала elevated/high і поточний none — зберігаємо elevated.
  // Одне старе повідомлення не блокує сесію назавжди — downgrade на один рівень.
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

  // 2. S2-інваріант: крах інсерту user-message → 500 ДО виклику Anthropic.
  // Safety-critical: не викликаємо LLM якщо не можемо зберегти повідомлення.
  let userMessageId: string | null = null;
  if (supabase) {
    const { data: insertData, error: insertError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: userMessage,
        prompt_version: process.env.ANTHROPIC_PROMPT_VERSION ?? 'v1.8',
      })
      .select('id')
      .single();

    if (insertError) {
      // S2-інваріант: крах інсерту user-message → 500, не продовжуємо
      console.error('[sendMessage] user message insert FAILED:', insertError.message, {
        sessionId,
      });
      return { kind: 'error', status: 500, error: 'storage failed' };
    }
    userMessageId = (insertData as { id: string } | null)?.id ?? null;
  }

  // 3. S2-інваріант: крах інсерту crisis_events → 500 (командою logCrisisEvent, §2.1).
  // Навіть якщо це ховає crisis-відповідь — документ виграє; UI має SOS-кнопку.
  if (effectiveCrisisLevel !== 'none' && supabase) {
    const logResult = await logCrisisEvent(
      {
        sessionId,
        userId: facts.userId,
        triggerMessageId: userMessageId,
        severity: effectiveCrisisLevel,
        jurisdiction: facts.jurisdiction ?? 'UA',
      },
      { supabase },
    );

    if (logResult.kind === 'error') {
      return { kind: 'error', status: logResult.status, error: logResult.error };
    }
  }

  // 4. High/imminent crisis → повертаємо JSON-сигнал, стрім не стартуємо
  if (crisis.severity === 'high' || crisis.severity === 'imminent') {
    return { kind: 'crisis', message: CRISIS_MESSAGE };
  }

  // 5. postCrisisMode з БД (persisted-режим): SELECT exists по crisis_events.
  // Demo-режим: false (не читаємо БД).
  let postCrisisMode = false;
  if (supabase) {
    const { data: crisisCheck } = await supabase
      .from('crisis_events')
      .select('id')
      .eq('session_id', sessionId)
      .in('severity', ['high', 'imminent'])
      .limit(1)
      .maybeSingle();
    postCrisisMode = crisisCheck !== null;
  }

  // 6. Формуємо messages[] для Anthropic з ефективної history.
  // Anthropic вимагає починати з user-turn — strip leading assistant turns.
  const messages: ChatTurn[] = [...effectiveHistory];
  while (messages.length > 0 && messages[0]!.role !== 'user') {
    messages.shift();
  }

  // Поточне user-повідомлення — останній елемент (якщо ще не в history).
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  // turnNumber — рахуємо user-turns у messages[] (§2.4: серверне поле).
  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  // 7. Час сесії — сервер є джерелом істини (§2.4).
  const nowMs = clock.now().getTime();
  const sessionStartedAt = facts.startedAtMs ?? null;
  const elapsedMin = sessionStartedAt
    ? Math.min(60, Math.max(0, Math.floor((nowMs - sessionStartedAt) / 60000)))
    : 0;

  // 8. exerciseOfferedInSession — з DB-history у persisted-режимі.
  const exerciseOfferedInSession =
    effectiveCrisisLevel === 'none'
      ? effectiveHistory.some(
          (m) =>
            m.role === 'assistant' && /\[(ВПРАВА|ЗАЗЕМЛЕННЯ|ТІЛО|RAIN|КОМПАС|ЯКІР)/.test(m.content),
        )
      : false;

  // 9. Будуємо SessionContext і системний промпт.
  const ctx: SessionContext = {
    ageBand: facts.ageBand ?? clientAgeBand ?? '16-17',
    locale: 'uk',
    jurisdiction: facts.jurisdiction ?? 'UA',
    sessionStartTime: new Date(sessionStartedAt ?? nowMs),
    elapsedMin,
    turnNumber: userTurnCount,
    themeChosen: null,
    currentMode: 1,
    fmDominant: null,
    modesSequence: [],
    companionshipDriftDetected: false,
    exerciseOfferedInSession,
    crisisLevel: effectiveCrisisLevel as typeof crisis.severity,
    hotlinesShown: [],
    userName: clientUserName,
    postCrisisMode,
  };

  const systemPrompt = buildSystemPrompt(ctx);

  // 10. Стрім токенів. Route handler накопичує fullResponse і
  // викликає persistAssistantMessage після закриття стріму.
  const tokenStream = anthropic.streamChat({
    model: (process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7').replace(/^﻿/, '').trim(),
    maxTokens: 512,
    system: systemPrompt.system,
    messages,
  });

  return { kind: 'stream', tokens: tokenStream };
}

// Окрема функція для збереження assistant-reply після стріму.
// Виносимо для тестованості: тест мокає supabase і перевіряє виклик.
export async function persistAssistantMessage(
  supabase: SupabaseClient,
  sessionId: string,
  fullResponse: string,
): Promise<void> {
  const asymmetryResult = validateAsymmetry(fullResponse);
  if (!asymmetryResult.valid) {
    console.warn('[asymmetry-violation]', asymmetryResult.matches, { sessionId });
  }

  const { error } = await supabase.from('messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: fullResponse,
    prompt_version: process.env.ANTHROPIC_PROMPT_VERSION ?? 'v1.8',
  });

  if (error) {
    // Стрім уже відданий: не можемо повернути 500. Фіксуємо як warn.
    // Кавеат: assistant-message може бути втрачений при збої БД після стріму.
    console.warn('[persistAssistantMessage] insert failed:', error.message, { sessionId });
  }
}
