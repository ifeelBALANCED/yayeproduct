// packages/contracts/src/index.ts
// Єдине джерело request/response типів (quality-gate §2.4).
// Три споживачі: route handlers, клієнтські fetch-обгортки, тести — YAGNI виконано.

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Спільні примітиви
// ---------------------------------------------------------------------------

const AgeBandSchema = z.enum(['13-15', '16-17', '18-25']);

const ChatTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  // Ліміт 2000 символів — узгоджено з MAX_MESSAGE_CHARS у route.ts
  content: z.string().max(2000),
});

// ---------------------------------------------------------------------------
// ChatRequestSchema — клієнт → POST /api/chat
//
// §2.4: sessionStartedAt / turnNumber / postCrisisMode — серверні поля,
// з клієнта НЕ приймаються. .strict() відхиляє зайві ключі.
// ---------------------------------------------------------------------------

export const ChatRequestSchema = z
  .object({
    sessionId: z.string().uuid(),
    userMessage: z.string().min(1).max(2000),
    // Bounded history: max 40 turns (достатньо для 25-хв сесії).
    // Кожен turn обмежений 2000 символів.
    history: z.array(ChatTurnSchema).max(40),
    // Demo-fallback для P0-3: коли Supabase не сконфігуровано, сервер
    // не має age_band з БД — клієнт передає вибір з онбордингу.
    // Сервер валідує enum і ніколи не довіряє цьому значенню, якщо є БД.
    ageBand: AgeBandSchema.nullable().optional(),
    // userName — читається сервером для buildContextBlock
    userName: z.string().max(32).nullable().optional(),
  })
  .strict();

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ---------------------------------------------------------------------------
// SessionsCreateRequestSchema — клієнт → POST /api/sessions
// ---------------------------------------------------------------------------

export const SessionsCreateRequestSchema = z
  .object({
    age_band: AgeBandSchema,
    user_name: z.string().max(32).nullable().optional(),
  })
  .strict();

export type SessionsCreateRequest = z.infer<typeof SessionsCreateRequestSchema>;

// ---------------------------------------------------------------------------
// SessionsCreateResponseSchema — сервер → клієнт
// ---------------------------------------------------------------------------

export const SessionsCreateResponseSchema = z.object({
  sessionId: z.string().uuid(),
  persisted: z.boolean(),
});

export type SessionsCreateResponse = z.infer<typeof SessionsCreateResponseSchema>;

// ---------------------------------------------------------------------------
// MessagesResponseSchema — GET /api/sessions/[id]/messages
// ---------------------------------------------------------------------------

const MessageRecordSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  created_at: z.string(),
});

export const MessagesResponseSchema = z.object({
  messages: z.array(MessageRecordSchema),
  persisted: z.boolean(),
});

export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;

// ---------------------------------------------------------------------------
// SseEventSchema — discriminated union SSE-подій (quality-gate §2.4)
//
// Точно моделює payload, що емітується route.ts:
//   token  → { type: 'token', text: string }
//   done   → { type: 'done' }
//   error  → { type: 'error', detail?: string }   (detail лише в dev)
//
// Кризовий { type: 'crisis', message: string } повертається як JSON
// (Content-Type: application/json), а не як SSE — тому він теж включений
// в union для повноти клієнтського парсингу JSON-відповіді.
// ---------------------------------------------------------------------------

const SseTokenEventSchema = z.object({
  type: z.literal('token'),
  // Поле «text» — саме так емітує route.ts (не «value»)
  text: z.string(),
});

const SseDoneEventSchema = z.object({
  type: z.literal('done'),
  // mode — зарезервовано для майбутніх фаз (phase-2 mode-classifier)
  mode: z.string().optional(),
});

const SseErrorEventSchema = z.object({
  type: z.literal('error'),
  // detail присутній лише в dev-режимі (route.ts intentionally omits in prod)
  detail: z.string().optional(),
});

const SseCrisisEventSchema = z.object({
  type: z.literal('crisis'),
  // message — текст, що відображається у UI до відкриття CrisisModal
  message: z.string(),
});

export const SseEventSchema = z.discriminatedUnion('type', [
  SseTokenEventSchema,
  SseDoneEventSchema,
  SseErrorEventSchema,
  SseCrisisEventSchema,
]);

export type SseEvent = z.infer<typeof SseEventSchema>;
export type SseTokenEvent = z.infer<typeof SseTokenEventSchema>;
export type SseDoneEvent = z.infer<typeof SseDoneEventSchema>;
export type SseErrorEvent = z.infer<typeof SseErrorEventSchema>;
export type SseCrisisEvent = z.infer<typeof SseCrisisEventSchema>;
