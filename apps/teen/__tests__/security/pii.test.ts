// S5 PII тест (quality-gate §S5).
// Перевіряє що submitBooking не логує контактні дані (email, telegram, contactValue тощо).
// Метод: spy на console.log/warn/error → виклик submitBooking → assert що жоден spy
// не отримав рядки з PII-значеннями.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitBooking } from '../../src/server/commands/submitBooking';
import type {
  SubmitBookingParams,
  SubmitBookingDeps,
} from '../../src/server/commands/submitBooking';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// PII-дані що НЕ мають з'являтись у логах
// ---------------------------------------------------------------------------

const PII_EMAIL = 'user.private@example.com';
const PII_TELEGRAM = '@user_private_handle';
const PII_NAME = 'PrivateUserName_TestOnly';
const PII_TOPIC = 'дуже особисте повідомлення про здоров’я';

const bookingParamsEmail: SubmitBookingParams = {
  specialistDbId: 'spec-001',
  sessionType: 'individual',
  userName: PII_NAME,
  contactPreferred: 'email',
  contactValue: PII_EMAIL,
  userAgeBand: '18-25',
  topic: PII_TOPIC,
  aiExcerpt: null,
  consentOffer: true,
  consentContact: true,
};

const bookingParamsTelegram: SubmitBookingParams = {
  specialistDbId: 'spec-002',
  sessionType: 'group',
  userName: PII_NAME,
  contactPreferred: 'telegram',
  contactValue: PII_TELEGRAM,
  userAgeBand: '16-17',
  topic: null,
  aiExcerpt: null,
  consentOffer: true,
  consentContact: false,
};

// ---------------------------------------------------------------------------
// Фейковий Supabase що симулює успішний insert
// ---------------------------------------------------------------------------

function makeSuccessSupabase(): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 'booking-001' }, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

// Supabase що кидає помилку при insert (перевіряємо і error-шлях)
function makeErrorSupabase(): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Допоміжна функція: збирає всі аргументи spy-викликів у рядок
// ---------------------------------------------------------------------------

function spyCallsToString(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls
    .flatMap((call) =>
      call.map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg && typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      }),
    )
    .join('\n');
}

// ---------------------------------------------------------------------------
// Тести
// ---------------------------------------------------------------------------

describe('submitBooking — PII не потрапляє у console logs', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('успішний insert: email не логується', async () => {
    const deps: SubmitBookingDeps = { supabase: makeSuccessSupabase() };
    await submitBooking(bookingParamsEmail, deps);

    const allLogs =
      spyCallsToString(logSpy) + spyCallsToString(warnSpy) + spyCallsToString(errorSpy);

    expect(allLogs).not.toContain(PII_EMAIL);
    expect(allLogs).not.toContain(PII_NAME);
    expect(allLogs).not.toContain(PII_TOPIC);
  });

  it('успішний insert: telegram не логується', async () => {
    const deps: SubmitBookingDeps = { supabase: makeSuccessSupabase() };
    await submitBooking(bookingParamsTelegram, deps);

    const allLogs =
      spyCallsToString(logSpy) + spyCallsToString(warnSpy) + spyCallsToString(errorSpy);

    expect(allLogs).not.toContain(PII_TELEGRAM);
    expect(allLogs).not.toContain(PII_NAME);
  });

  it('insert error: email не логується навіть при збої', async () => {
    const deps: SubmitBookingDeps = { supabase: makeErrorSupabase() };
    await submitBooking(bookingParamsEmail, deps);

    const allLogs =
      spyCallsToString(logSpy) + spyCallsToString(warnSpy) + spyCallsToString(errorSpy);

    expect(allLogs).not.toContain(PII_EMAIL);
    expect(allLogs).not.toContain(PII_NAME);
    expect(allLogs).not.toContain(PII_TOPIC);
  });

  it('insert error: telegram не логується навіть при збої', async () => {
    const deps: SubmitBookingDeps = { supabase: makeErrorSupabase() };
    await submitBooking(bookingParamsTelegram, deps);

    const allLogs =
      spyCallsToString(logSpy) + spyCallsToString(warnSpy) + spyCallsToString(errorSpy);

    expect(allLogs).not.toContain(PII_TELEGRAM);
    expect(allLogs).not.toContain(PII_NAME);
  });

  it('demo-режим (supabase: null, спеціаліст null): логується лише sessionType і ageBand', async () => {
    const demoParams: SubmitBookingParams = {
      ...bookingParamsEmail,
      specialistDbId: null, // demo: без спеціаліста
    };
    const deps: SubmitBookingDeps = { supabase: null };
    await submitBooking(demoParams, deps);

    const allLogs = spyCallsToString(logSpy);

    // PII не логується
    expect(allLogs).not.toContain(PII_EMAIL);
    expect(allLogs).not.toContain(PII_NAME);
    expect(allLogs).not.toContain(PII_TOPIC);

    // Лише безпечні діагностичні поля
    expect(allLogs).toContain('individual'); // sessionType
    expect(allLogs).toContain('18-25'); // ageBand
  });

  it('contactValue з email-адресою не зявляється у жодному spy', async () => {
    const uniqueEmail = 'super.unique.pii.test@pii-test.example.com';
    const params: SubmitBookingParams = {
      ...bookingParamsEmail,
      contactValue: uniqueEmail,
    };
    const deps: SubmitBookingDeps = { supabase: makeSuccessSupabase() };
    await submitBooking(params, deps);

    const allLogs = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
      .flatMap((call) => call.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))))
      .join('\n');

    expect(allLogs).not.toContain(uniqueEmail);
  });
});
