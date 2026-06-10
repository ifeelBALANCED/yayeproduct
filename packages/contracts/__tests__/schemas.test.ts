// packages/contracts/__tests__/schemas.test.ts
// Тести для кожної схеми: valid / invalid / boundary (quality-gate §S1).

import { describe, it, expect } from 'vitest';
import {
  ChatRequestSchema,
  SessionsCreateRequestSchema,
  SessionsCreateResponseSchema,
  MessagesResponseSchema,
  SseEventSchema,
} from '../src/index';

// ---------------------------------------------------------------------------
// Хелпери
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const STR_2000 = 'а'.repeat(2000);
const STR_2001 = 'а'.repeat(2001);

// ---------------------------------------------------------------------------
// ChatRequestSchema
// ---------------------------------------------------------------------------

describe('ChatRequestSchema', () => {
  it('valid — мінімальний запит', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [],
    });
    expect(result.success).toBe(true);
  });

  it('valid — повний запит з опційними полями', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [
        { role: 'user', content: 'перше' },
        { role: 'assistant', content: 'відповідь' },
      ],
      ageBand: '16-17',
      userName: 'Марко',
    });
    expect(result.success).toBe(true);
  });

  it('valid — ageBand null', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [],
      ageBand: null,
    });
    expect(result.success).toBe(true);
  });

  it('valid — userMessage рівно 2000 символів (boundary)', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: STR_2000,
      history: [],
    });
    expect(result.success).toBe(true);
  });

  it('invalid — userMessage 2001 символ (boundary)', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: STR_2001,
      history: [],
    });
    expect(result.success).toBe(false);
  });

  it('invalid — порожнє userMessage', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: '',
      history: [],
    });
    expect(result.success).toBe(false);
  });

  it('invalid — bad uuid у sessionId', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: 'not-a-uuid',
      userMessage: 'привіт',
      history: [],
    });
    expect(result.success).toBe(false);
  });

  it('invalid — history.content перевищує 2000 символів', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [{ role: 'user', content: STR_2001 }],
    });
    expect(result.success).toBe(false);
  });

  it('invalid — history більше 40 елементів', () => {
    const history = Array.from({ length: 41 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x',
    }));
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history,
    });
    expect(result.success).toBe(false);
  });

  it('invalid — history рівно 40 елементів дозволено (boundary)', () => {
    const history = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x',
    }));
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history,
    });
    expect(result.success).toBe(true);
  });

  it('invalid — невалідний ageBand', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [],
      ageBand: '10-12',
    });
    expect(result.success).toBe(false);
  });

  it('invalid — extra keys відхиляються (.strict())', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [],
      // §2.4: серверні поля — не приймаються з клієнта
      turnNumber: 5,
    });
    expect(result.success).toBe(false);
  });

  it('invalid — sessionStartedAt відхиляється (.strict())', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [],
      sessionStartedAt: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it('invalid — postCrisisMode відхиляється (.strict())', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [],
      postCrisisMode: true,
    });
    expect(result.success).toBe(false);
  });

  it('invalid — history role некоректна', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: VALID_UUID,
      userMessage: 'привіт',
      history: [{ role: 'system', content: 'hack' }],
    });
    expect(result.success).toBe(false);
  });

  it('safeParse повертає перше issue message при помилці', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: 'bad',
      userMessage: 'привіт',
      history: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(typeof result.error.issues[0]?.message).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// SessionsCreateRequestSchema
// ---------------------------------------------------------------------------

describe('SessionsCreateRequestSchema', () => {
  it('valid — мінімальний (тільки age_band)', () => {
    const result = SessionsCreateRequestSchema.safeParse({ age_band: '13-15' });
    expect(result.success).toBe(true);
  });

  it('valid — з user_name', () => {
    const result = SessionsCreateRequestSchema.safeParse({
      age_band: '18-25',
      user_name: 'Аліна',
    });
    expect(result.success).toBe(true);
  });

  it('valid — user_name null', () => {
    const result = SessionsCreateRequestSchema.safeParse({
      age_band: '16-17',
      user_name: null,
    });
    expect(result.success).toBe(true);
  });

  it('valid — всі три age_band enum-значення', () => {
    for (const band of ['13-15', '16-17', '18-25'] as const) {
      expect(SessionsCreateRequestSchema.safeParse({ age_band: band }).success).toBe(true);
    }
  });

  it('invalid — age_band відсутній', () => {
    const result = SessionsCreateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('invalid — невалідний age_band', () => {
    const result = SessionsCreateRequestSchema.safeParse({ age_band: '25-30' });
    expect(result.success).toBe(false);
  });

  it('invalid — user_name > 32 символи', () => {
    const result = SessionsCreateRequestSchema.safeParse({
      age_band: '16-17',
      user_name: 'а'.repeat(33),
    });
    expect(result.success).toBe(false);
  });

  it('valid — user_name рівно 32 символи (boundary)', () => {
    const result = SessionsCreateRequestSchema.safeParse({
      age_band: '16-17',
      user_name: 'а'.repeat(32),
    });
    expect(result.success).toBe(true);
  });

  it('invalid — extra keys відхиляються (.strict())', () => {
    const result = SessionsCreateRequestSchema.safeParse({
      age_band: '16-17',
      extra_field: 'hack',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SessionsCreateResponseSchema
// ---------------------------------------------------------------------------

describe('SessionsCreateResponseSchema', () => {
  it('valid — persisted true', () => {
    const result = SessionsCreateResponseSchema.safeParse({
      sessionId: VALID_UUID,
      persisted: true,
    });
    expect(result.success).toBe(true);
  });

  it('valid — persisted false (demo-режим)', () => {
    const result = SessionsCreateResponseSchema.safeParse({
      sessionId: VALID_UUID,
      persisted: false,
    });
    expect(result.success).toBe(true);
  });

  it('invalid — sessionId не uuid', () => {
    const result = SessionsCreateResponseSchema.safeParse({
      sessionId: 'not-a-uuid',
      persisted: true,
    });
    expect(result.success).toBe(false);
  });

  it('invalid — persisted відсутній', () => {
    const result = SessionsCreateResponseSchema.safeParse({ sessionId: VALID_UUID });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MessagesResponseSchema
// ---------------------------------------------------------------------------

describe('MessagesResponseSchema', () => {
  it('valid — порожній масив (fallback-режим)', () => {
    const result = MessagesResponseSchema.safeParse({ messages: [], persisted: false });
    expect(result.success).toBe(true);
  });

  it('valid — масив повідомлень', () => {
    const result = MessagesResponseSchema.safeParse({
      messages: [
        { role: 'user', content: 'привіт', created_at: '2026-06-10T12:00:00Z' },
        { role: 'assistant', content: 'я тут.', created_at: '2026-06-10T12:00:01Z' },
      ],
      persisted: true,
    });
    expect(result.success).toBe(true);
  });

  it('invalid — role некоректна', () => {
    const result = MessagesResponseSchema.safeParse({
      messages: [{ role: 'system', content: 'x', created_at: '2026-06-10T12:00:00Z' }],
      persisted: true,
    });
    expect(result.success).toBe(false);
  });

  it('invalid — persisted відсутній', () => {
    const result = MessagesResponseSchema.safeParse({ messages: [] });
    expect(result.success).toBe(false);
  });

  it('invalid — messages не масив', () => {
    const result = MessagesResponseSchema.safeParse({ messages: null, persisted: false });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SseEventSchema — discriminated union
// ---------------------------------------------------------------------------

describe('SseEventSchema', () => {
  // token event
  it('valid — token event', () => {
    const result = SseEventSchema.safeParse({ type: 'token', text: 'привіт' });
    expect(result.success).toBe(true);
  });

  it('invalid — token event без text', () => {
    const result = SseEventSchema.safeParse({ type: 'token' });
    expect(result.success).toBe(false);
  });

  it('invalid — token event з порожнім text (дозволено — порожній токен)', () => {
    // Порожній рядок є валідним токеном (whitespace streaming)
    const result = SseEventSchema.safeParse({ type: 'token', text: '' });
    expect(result.success).toBe(true);
  });

  // done event
  it('valid — done event без mode', () => {
    const result = SseEventSchema.safeParse({ type: 'done' });
    expect(result.success).toBe(true);
  });

  it('valid — done event з mode (зарезервовано для phase-2)', () => {
    const result = SseEventSchema.safeParse({ type: 'done', mode: 'MODE:2' });
    expect(result.success).toBe(true);
  });

  // error event
  it('valid — error event без detail (prod)', () => {
    const result = SseEventSchema.safeParse({ type: 'error' });
    expect(result.success).toBe(true);
  });

  it('valid — error event з detail (dev)', () => {
    const result = SseEventSchema.safeParse({ type: 'error', detail: 'API timeout' });
    expect(result.success).toBe(true);
  });

  // crisis event (JSON-відповідь, не SSE, але включена для повноти)
  it('valid — crisis event', () => {
    const result = SseEventSchema.safeParse({
      type: 'crisis',
      message: 'стоп. зупинись на секунду.',
    });
    expect(result.success).toBe(true);
  });

  it('invalid — crisis event без message', () => {
    const result = SseEventSchema.safeParse({ type: 'crisis' });
    expect(result.success).toBe(false);
  });

  // невідомий type — відхиляється
  it('invalid — невідомий type відхиляється', () => {
    const result = SseEventSchema.safeParse({ type: 'unknown', data: 'something' });
    expect(result.success).toBe(false);
  });

  it('invalid — type відсутній', () => {
    const result = SseEventSchema.safeParse({ text: 'hello' });
    expect(result.success).toBe(false);
  });

  it("invalid — порожній об'єкт", () => {
    const result = SseEventSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  // Тест safeParse не кидає виняток на сміттєвий input
  it('safeParse не кидає на non-object input', () => {
    expect(() => SseEventSchema.safeParse(null)).not.toThrow();
    expect(() => SseEventSchema.safeParse('raw string')).not.toThrow();
    expect(() => SseEventSchema.safeParse(42)).not.toThrow();
  });
});
