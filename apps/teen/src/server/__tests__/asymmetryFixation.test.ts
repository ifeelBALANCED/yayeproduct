// asymmetryFixation.test.ts — S6 gate (docs/quality-gate.md §3 S6).
// Тест-фіксація: persistAssistantMessage ВИКЛИКАЄ validateAsymmetry
// і console.warn при порушенні.
// Стиль моків: аналогічний sendMessage.test.ts.

import { describe, it, expect, vi } from 'vitest';
import { persistAssistantMessage } from '../commands/sendMessage';
import type { SupabaseClient } from '@supabase/supabase-js';

// Фейковий Supabase — insert завжди успішний (тест фокусується на asymmetry)
function makeInsertOkSupabase(): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({ error: null }),
    }),
  } as unknown as SupabaseClient;
}

// Фейковий Supabase — insert падає (для перевірки warn-шляху)
function makeInsertFailSupabase(): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({ error: { message: 'DB down' } }),
    }),
  } as unknown as SupabaseClient;
}

const TEST_SESSION_ID = '22222222-2222-2222-2222-222222222222';

describe('persistAssistantMessage · S6 asymmetry fixation', () => {
  it('викликає validateAsymmetry — НЕ дає warn на чистій відповіді', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const supabase = makeInsertOkSupabase();

    await persistAssistantMessage(supabase, TEST_SESSION_ID, 'я тут.');

    // Жодного asymmetry-warn для валідного тексту
    const asymmetryWarns = warnSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('[asymmetry-violation]'),
    );
    expect(asymmetryWarns).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it('дає console.warn [asymmetry-violation] при «я думала про тебе»', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const supabase = makeInsertOkSupabase();

    await persistAssistantMessage(supabase, TEST_SESSION_ID, 'я думала про тебе весь день.');

    const asymmetryWarns = warnSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('[asymmetry-violation]'),
    );
    expect(asymmetryWarns).toHaveLength(1);
    warnSpy.mockRestore();
  });

  it('дає console.warn [asymmetry-violation] при «мені тебе бракувало»', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const supabase = makeInsertOkSupabase();

    await persistAssistantMessage(supabase, TEST_SESSION_ID, 'мені тебе бракувало.');

    const asymmetryWarns = warnSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('[asymmetry-violation]'),
    );
    expect(asymmetryWarns).toHaveLength(1);
    warnSpy.mockRestore();
  });

  it('дає console.warn [asymmetry-violation] при «я скучила»', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const supabase = makeInsertOkSupabase();

    await persistAssistantMessage(supabase, TEST_SESSION_ID, 'я скучила за тобою.');

    const asymmetryWarns = warnSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('[asymmetry-violation]'),
    );
    expect(asymmetryWarns).toHaveLength(1);
    warnSpy.mockRestore();
  });

  it('warn містить список matches (масив рядків)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const supabase = makeInsertOkSupabase();

    await persistAssistantMessage(supabase, TEST_SESSION_ID, 'я думала про тебе весь день.');

    const asymmetryCall = warnSpy.mock.calls.find(
      (args) => typeof args[0] === 'string' && args[0].includes('[asymmetry-violation]'),
    );
    expect(asymmetryCall).toBeDefined();
    // Другий аргумент — масив matches (validateAsymmetry повертає matches: string[])
    expect(Array.isArray(asymmetryCall?.[1])).toBe(true);
    expect((asymmetryCall?.[1] as string[]).length).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });

  it('warn містить sessionId у третьому аргументі', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const supabase = makeInsertOkSupabase();

    await persistAssistantMessage(supabase, TEST_SESSION_ID, 'я скучила.');

    const asymmetryCall = warnSpy.mock.calls.find(
      (args) => typeof args[0] === 'string' && args[0].includes('[asymmetry-violation]'),
    );
    expect(asymmetryCall).toBeDefined();
    // Третій аргумент — { sessionId }
    expect(asymmetryCall?.[2]).toEqual({ sessionId: TEST_SESSION_ID });
    warnSpy.mockRestore();
  });

  it('НЕ кидає виняток навіть при DB-помилці + asymmetry порушенні', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const supabase = makeInsertFailSupabase();

    await expect(
      persistAssistantMessage(supabase, TEST_SESSION_ID, 'я думала про тебе.'),
    ).resolves.toBeUndefined();

    warnSpy.mockRestore();
  });
});
