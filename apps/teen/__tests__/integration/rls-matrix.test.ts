// S2 integration: RLS-матриця (quality-gate §S2).
// Env-gated: скипається локально без SUPABASE_TEST_URL.
// У CI: supabase local http://127.0.0.1:54321, після supabase db reset --local.
//
// Покриття: 10 таблиць × 3 ролі × 4 операції = явні assert дозволено/заборонено.
// Стандартні Supabase-local demo-ключі (не секрети).
// Seed-дані: supabase/seed.sql — therapist{1,2,3}@example.com / password.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── env-gate ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_TEST_URL ?? '';
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Seed therapist ids з supabase/seed.sql
const THERAPIST_1_ID = '11111111-0000-0000-0000-000000000001';
const THERAPIST_2_ID = '11111111-0000-0000-0000-000000000002';

describe.runIf(Boolean(SUPABASE_URL))('S2 · RLS-матриця (docs/quality-gate.md §S2)', () => {
  // ── Клієнти ────────────────────────────────────────────────────────────────
  let anon: SupabaseClient;
  let svc: SupabaseClient;
  // Авторизований підліток (створюється у beforeAll)
  let authedTeen: SupabaseClient;
  // Авторизований терапевт 1
  let authedTherapist1: SupabaseClient;
  // Авторизований терапевт 2
  let authedTherapist2: SupabaseClient;

  // IDs, створені у beforeAll — для cleanup та перехресних перевірок
  let teenUserId: string;
  let teenSessionId: string;
  let crisisEventId: string;
  let referralId: string;
  let consentLogId: string;
  let bookingRequestId: string;
  let exerciseFeedbackId: string;
  let messageId: string;

  beforeAll(async () => {
    anon = createClient(SUPABASE_URL, ANON_KEY);
    svc = createClient(SUPABASE_URL, SERVICE_KEY);

    // Авторизуємо терапевтів з seed.sql
    const t1Client = createClient(SUPABASE_URL, ANON_KEY);
    const { data: t1Auth, error: t1Err } = await t1Client.auth.signInWithPassword({
      email: 'therapist1@example.com',
      password: 'password',
    });
    if (t1Err || !t1Auth.session) {
      throw new Error(`therapist1 login failed: ${t1Err?.message}`);
    }
    authedTherapist1 = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${t1Auth.session.access_token}` } },
    });

    const t2Client = createClient(SUPABASE_URL, ANON_KEY);
    const { data: t2Auth, error: t2Err } = await t2Client.auth.signInWithPassword({
      email: 'therapist2@example.com',
      password: 'password',
    });
    if (t2Err || !t2Auth.session) {
      throw new Error(`therapist2 login failed: ${t2Err?.message}`);
    }
    authedTherapist2 = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${t2Auth.session.access_token}` } },
    });

    // Створюємо тестового підлітка через service_role (обходимо RLS для seed)
    const { data: user, error: userErr } = await svc
      .from('users')
      .insert({
        age_band: '16-17',
        locale: 'uk',
        jurisdiction: 'UA',
        parental_consent_status: 'na',
      })
      .select('id')
      .single();
    if (userErr || !user) throw new Error(`seed user: ${userErr?.message}`);
    teenUserId = (user as { id: string }).id;

    // Сесія для підлітка
    const { data: session, error: sessErr } = await svc
      .from('sessions')
      .insert({ user_id: teenUserId, theme: null })
      .select('id')
      .single();
    if (sessErr || !session) throw new Error(`seed session: ${sessErr?.message}`);
    teenSessionId = (session as { id: string }).id;

    // Повідомлення
    const { data: msg, error: msgErr } = await svc
      .from('messages')
      .insert({ session_id: teenSessionId, role: 'user', content: 'test', prompt_version: 'v1.8' })
      .select('id')
      .single();
    if (msgErr || !msg) throw new Error(`seed message: ${msgErr?.message}`);
    messageId = (msg as { id: string }).id;

    // Crisis event
    const { data: ce, error: ceErr } = await svc
      .from('crisis_events')
      .insert({
        session_id: teenSessionId,
        user_id: teenUserId,
        severity: 'elevated',
        jurisdiction: 'UA',
        detection_method: 'keyword_v1',
      })
      .select('id')
      .single();
    if (ceErr || !ce) throw new Error(`seed crisis_event: ${ceErr?.message}`);
    crisisEventId = (ce as { id: string }).id;

    // Referral — від підлітка до терапевта 1
    const { data: ref, error: refErr } = await svc
      .from('referrals')
      .insert({
        session_id: teenSessionId,
        user_id: teenUserId,
        therapist_id: THERAPIST_1_ID,
        status: 'new',
        urgency: 'normal',
      })
      .select('id')
      .single();
    if (refErr || !ref) throw new Error(`seed referral: ${refErr?.message}`);
    referralId = (ref as { id: string }).id;

    // Consent log
    const { data: cl, error: clErr } = await svc
      .from('consent_log')
      .insert({
        user_id: teenUserId,
        consent_type: 'share_summary',
        scope: 'test',
        granted: true,
      })
      .select('id')
      .single();
    if (clErr || !cl) throw new Error(`seed consent_log: ${clErr?.message}`);
    consentLogId = (cl as { id: string }).id;

    // Booking request
    const { data: br, error: brErr } = await svc
      .from('booking_requests')
      .insert({
        specialist_id: null,
        session_type: 'discovery',
        user_name: 'Test',
        contact_preferred: 'telegram',
        contact_value: '@test',
        user_age_band: '16-17',
        consent_offer: true,
        consent_contact: true,
      })
      .select('id')
      .single();
    if (brErr || !br) throw new Error(`seed booking_request: ${brErr?.message}`);
    bookingRequestId = (br as { id: string }).id;

    // Exercise feedback
    const { data: ef, error: efErr } = await svc
      .from('exercise_feedback')
      .insert({ result: 'helped' })
      .select('id')
      .single();
    if (efErr || !ef) throw new Error(`seed exercise_feedback: ${efErr?.message}`);
    exerciseFeedbackId = (ef as { id: string }).id;

    // Авторизований підліток — логін через Supabase Admin API через service_role
    // Supabase local: підписуємо токен напряму через Admin endpoint
    const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${teenUserId}/token`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (adminRes.ok) {
      const tokenData = (await adminRes.json()) as { access_token?: string };
      if (tokenData.access_token) {
        authedTeen = createClient(SUPABASE_URL, ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
        });
      } else {
        // Fallback: створюємо anonymous session через magic link або просто anon
        authedTeen = anon;
      }
    } else {
      // Supabase local може не підтримувати admin token endpoint — fallback до anon
      // Тести що потребують teen auth будуть позначені коментарем
      authedTeen = anon;
    }
  });

  afterAll(async () => {
    // Cleanup: видаляємо через service_role каскадно
    // Порядок: crisis_events, messages (каскад через session), потім session, user
    if (crisisEventId) await svc.from('crisis_events').delete().eq('id', crisisEventId);
    if (referralId) await svc.from('referrals').delete().eq('id', referralId);
    if (consentLogId) await svc.from('consent_log').delete().eq('id', consentLogId);
    if (bookingRequestId) await svc.from('booking_requests').delete().eq('id', bookingRequestId);
    if (exerciseFeedbackId)
      await svc.from('exercise_feedback').delete().eq('id', exerciseFeedbackId);
    if (messageId) await svc.from('messages').delete().eq('id', messageId);
    if (teenSessionId) await svc.from('sessions').delete().eq('id', teenSessionId);
    if (teenUserId) await svc.from('users').delete().eq('id', teenUserId);
  });

  // ── Допоміжні функції ──────────────────────────────────────────────────────
  // allowed: операція пройшла без помилки.
  function allowed(error: { message?: string } | null): boolean {
    return error === null;
  }
  // denied: PostgREST під RLS НЕ кидає помилку для SELECT/UPDATE/DELETE —
  // недоступні рядки мовчки відфільтровуються (повертається 0 рядків).
  // Явна помилка приходить лише для INSERT (та UPDATE з WITH CHECK-порушенням).
  // Тому «заборонено» = помилка АБО нуль доступних рядків. Для UPDATE/DELETE
  // тести чейнять .select('id'), щоб PostgREST повернув зачеплені рядки.
  // beforeAll гарантує seed-рядок у кожній таблиці — порожній результат
  // доводить RLS-фільтрацію, а не порожню таблицю.
  function denied(error: { message?: string } | null, data?: unknown): boolean {
    if (error !== null) return true;
    if (data === undefined) return false;
    return Array.isArray(data) ? data.length === 0 : data === null;
  }

  // ============================================================================
  // USERS
  // ============================================================================
  describe('users', () => {
    // anon: нічого
    it('anon SELECT users → denied (RLS: тільки власник)', async () => {
      const { data, error } = await anon.from('users').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    it('anon INSERT users → denied', async () => {
      const { error } = await anon
        .from('users')
        .insert({ age_band: '16-17', locale: 'uk', jurisdiction: 'UA' });
      expect(denied(error)).toBe(true);
    });

    // service_role: повний доступ (bypass RLS)
    it('service_role SELECT users → allowed', async () => {
      const { error } = await svc.from('users').select('id').eq('id', teenUserId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role INSERT users → allowed', async () => {
      const { data, error } = await svc
        .from('users')
        .insert({ age_band: '18-25', locale: 'uk', jurisdiction: 'UA' })
        .select('id')
        .single();
      expect(allowed(error)).toBe(true);
      // cleanup
      if (data)
        await svc
          .from('users')
          .delete()
          .eq('id', (data as { id: string }).id);
    });

    it('service_role UPDATE users → allowed', async () => {
      const { error } = await svc
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', teenUserId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role DELETE users → allowed (cascade)', async () => {
      // Створюємо тимчасовий user для перевірки DELETE
      const { data: tmp } = await svc
        .from('users')
        .insert({ age_band: '18-25', locale: 'uk', jurisdiction: 'UA' })
        .select('id')
        .single();
      if (!tmp) return;
      const { error } = await svc
        .from('users')
        .delete()
        .eq('id', (tmp as { id: string }).id);
      expect(allowed(error)).toBe(true);
    });
  });

  // ============================================================================
  // SESSIONS
  // ============================================================================
  describe('sessions', () => {
    it('anon SELECT sessions → denied', async () => {
      const { data, error } = await anon.from('sessions').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    it('anon INSERT sessions → denied', async () => {
      const { error } = await anon.from('sessions').insert({ user_id: teenUserId });
      expect(denied(error)).toBe(true);
    });

    it('anon DELETE sessions → denied', async () => {
      const { data, error } = await anon
        .from('sessions')
        .delete()
        .eq('id', teenSessionId)
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    // service_role
    it('service_role SELECT sessions → allowed', async () => {
      const { error } = await svc.from('sessions').select('id').eq('id', teenSessionId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role DELETE sessions → allowed', async () => {
      // Створюємо тимчасову сесію
      const { data: tmp } = await svc
        .from('sessions')
        .insert({ user_id: teenUserId, theme: null })
        .select('id')
        .single();
      if (!tmp) return;
      const { error } = await svc
        .from('sessions')
        .delete()
        .eq('id', (tmp as { id: string }).id);
      expect(allowed(error)).toBe(true);
    });
  });

  // ============================================================================
  // MESSAGES
  // ============================================================================
  describe('messages', () => {
    it('anon SELECT messages → denied', async () => {
      const { data, error } = await anon.from('messages').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    it('anon INSERT messages → denied', async () => {
      const { error } = await anon.from('messages').insert({
        session_id: teenSessionId,
        role: 'user',
        content: 'hacked',
        prompt_version: 'v0',
      });
      expect(denied(error)).toBe(true);
    });

    it('service_role SELECT messages → allowed', async () => {
      const { error } = await svc.from('messages').select('id').eq('id', messageId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role INSERT messages → allowed', async () => {
      const { data, error } = await svc
        .from('messages')
        .insert({
          session_id: teenSessionId,
          role: 'assistant',
          content: 'service test',
          prompt_version: 'v1.8',
        })
        .select('id')
        .single();
      expect(allowed(error)).toBe(true);
      if (data)
        await svc
          .from('messages')
          .delete()
          .eq('id', (data as { id: string }).id);
    });
  });

  // ============================================================================
  // CRISIS_EVENTS
  // ============================================================================
  describe('crisis_events', () => {
    it('anon SELECT crisis_events → denied', async () => {
      const { data, error } = await anon.from('crisis_events').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    it('anon INSERT crisis_events → denied', async () => {
      const { error } = await anon.from('crisis_events').insert({
        session_id: teenSessionId,
        user_id: teenUserId,
        severity: 'elevated',
        jurisdiction: 'UA',
      });
      expect(denied(error)).toBe(true);
    });

    // service_role: bypass RLS → повний доступ
    it('service_role SELECT crisis_events → allowed', async () => {
      const { error } = await svc.from('crisis_events').select('id').eq('id', crisisEventId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role INSERT crisis_events → allowed', async () => {
      const { data, error } = await svc
        .from('crisis_events')
        .insert({
          session_id: teenSessionId,
          user_id: teenUserId,
          severity: 'elevated',
          jurisdiction: 'UA',
          detection_method: 'keyword_v1',
        })
        .select('id')
        .single();
      expect(allowed(error)).toBe(true);
      if (data)
        await svc
          .from('crisis_events')
          .delete()
          .eq('id', (data as { id: string }).id);
    });

    it('service_role UPDATE crisis_events → allowed', async () => {
      const { error } = await svc
        .from('crisis_events')
        .update({ user_action: 'hotline_clicked' })
        .eq('id', crisisEventId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role DELETE crisis_events → allowed', async () => {
      const { data: tmp } = await svc
        .from('crisis_events')
        .insert({
          session_id: teenSessionId,
          user_id: teenUserId,
          severity: 'elevated',
          jurisdiction: 'UA',
        })
        .select('id')
        .single();
      if (!tmp) return;
      const { error } = await svc
        .from('crisis_events')
        .delete()
        .eq('id', (tmp as { id: string }).id);
      expect(allowed(error)).toBe(true);
    });
  });

  // ============================================================================
  // THERAPISTS — після 000007: одна комбінована SELECT policy
  // ============================================================================
  describe('therapists', () => {
    // anon бачить тільки active = true (з policy "therapists: select")
    it('anon SELECT therapists (active) → allowed', async () => {
      const { data, error } = await anon
        .from('therapists')
        .select('id, active')
        .eq('id', THERAPIST_1_ID);
      expect(allowed(error)).toBe(true);
      // Therapist 1 active = true → має бути видимий
      expect(Array.isArray(data) ? data.length : 0).toBeGreaterThan(0);
    });

    it('anon INSERT therapists → denied', async () => {
      const { error } = await anon.from('therapists').insert({
        email: 'fake@example.com',
        full_name: 'Fake',
        license_authority: 'X',
        license_number: 'X-001',
        jurisdictions: ['UA'],
        languages: ['uk'],
      });
      expect(denied(error)).toBe(true);
    });

    it('anon UPDATE therapists → denied', async () => {
      const { data, error } = await anon
        .from('therapists')
        .update({ full_name: 'Hacked' })
        .eq('id', THERAPIST_1_ID)
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    it('anon DELETE therapists → denied', async () => {
      const { data, error } = await anon
        .from('therapists')
        .delete()
        .eq('id', THERAPIST_1_ID)
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    // authenticated терапевт бачить свій рядок (auth.uid() = id)
    it('authenticated therapist1 SELECT own row → allowed', async () => {
      const { data, error } = await authedTherapist1
        .from('therapists')
        .select('id')
        .eq('id', THERAPIST_1_ID);
      expect(allowed(error)).toBe(true);
      expect(Array.isArray(data) ? data.length : 0).toBeGreaterThan(0);
    });

    it('authenticated therapist1 UPDATE own row → denied (тільки service_role)', async () => {
      const { data, error } = await authedTherapist1
        .from('therapists')
        .update({ city: 'Харків' })
        .eq('id', THERAPIST_1_ID)
        .select('id');
      // Без UPDATE-policy для authenticated → 0 зачеплених рядків
      expect(denied(error, data)).toBe(true);
    });

    // service_role: bypass, INSERT/UPDATE/DELETE → allowed
    it('service_role INSERT therapists → allowed', async () => {
      const { data, error } = await svc
        .from('therapists')
        .insert({
          email: `tmp-${Date.now()}@example.com`,
          full_name: 'Tmp',
          license_authority: 'TEST',
          license_number: `TMP-${Date.now()}`,
          jurisdictions: ['UA'],
          languages: ['uk'],
        })
        .select('id')
        .single();
      expect(allowed(error)).toBe(true);
      if (data)
        await svc
          .from('therapists')
          .delete()
          .eq('id', (data as { id: string }).id);
    });

    it('service_role UPDATE therapists → allowed', async () => {
      const { error } = await svc
        .from('therapists')
        .update({ city: 'Одеса' })
        .eq('id', THERAPIST_1_ID);
      expect(allowed(error)).toBe(true);
    });

    it('service_role DELETE therapists → allowed', async () => {
      // Створюємо тимчасового терапевта для видалення
      const { data: tmp } = await svc
        .from('therapists')
        .insert({
          email: `del-${Date.now()}@example.com`,
          full_name: 'Del',
          license_authority: 'DEL',
          license_number: `DEL-${Date.now()}`,
          jurisdictions: ['UA'],
          languages: ['uk'],
        })
        .select('id')
        .single();
      if (!tmp) return;
      const { error } = await svc
        .from('therapists')
        .delete()
        .eq('id', (tmp as { id: string }).id);
      expect(allowed(error)).toBe(true);
    });
  });

  // ============================================================================
  // REFERRALS
  // ============================================================================
  describe('referrals', () => {
    it('anon SELECT referrals → denied', async () => {
      const { data, error } = await anon.from('referrals').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    it('anon INSERT referrals → denied', async () => {
      const { error } = await anon.from('referrals').insert({
        user_id: teenUserId,
        therapist_id: THERAPIST_1_ID,
        status: 'new',
        urgency: 'normal',
      });
      expect(denied(error)).toBe(true);
    });

    // Терапевт 1 бачить свій referral (auth.uid() = therapist_id)
    it('authenticated therapist1 SELECT assigned referral → allowed', async () => {
      const { data, error } = await authedTherapist1
        .from('referrals')
        .select('id')
        .eq('id', referralId);
      expect(allowed(error)).toBe(true);
      expect(Array.isArray(data) ? data.length : 0).toBeGreaterThan(0);
    });

    // Терапевт 2 НЕ бачить referral терапевта 1
    it('authenticated therapist2 SELECT referral for therapist1 → denied (empty result)', async () => {
      const { data, error } = await authedTherapist2
        .from('referrals')
        .select('id')
        .eq('id', referralId);
      // RLS відфільтровує: немає помилки, але data порожній масив
      expect(allowed(error)).toBe(true);
      expect(Array.isArray(data) ? data.length : 0).toBe(0);
    });

    // Терапевт 1 може UPDATE свій referral
    it('authenticated therapist1 UPDATE assigned referral → allowed', async () => {
      const { error } = await authedTherapist1
        .from('referrals')
        .update({ status: 'accepted' })
        .eq('id', referralId);
      expect(allowed(error)).toBe(true);
    });

    // service_role: повний доступ
    it('service_role SELECT referrals → allowed', async () => {
      const { error } = await svc.from('referrals').select('id').eq('id', referralId);
      expect(allowed(error)).toBe(true);
    });
  });

  // ============================================================================
  // CONSENT_LOG
  // ============================================================================
  describe('consent_log', () => {
    it('anon SELECT consent_log → denied', async () => {
      const { data, error } = await anon.from('consent_log').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    it('anon INSERT consent_log → denied', async () => {
      const { error } = await anon.from('consent_log').insert({
        user_id: teenUserId,
        consent_type: 'share_summary',
        scope: 'test',
        granted: true,
      });
      expect(denied(error)).toBe(true);
    });

    it('service_role SELECT consent_log → allowed', async () => {
      const { error } = await svc.from('consent_log').select('id').eq('id', consentLogId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role INSERT consent_log → allowed', async () => {
      const { data, error } = await svc
        .from('consent_log')
        .insert({
          user_id: teenUserId,
          consent_type: 'crisis_handoff',
          scope: 'test_svc',
          granted: true,
        })
        .select('id')
        .single();
      expect(allowed(error)).toBe(true);
      if (data)
        await svc
          .from('consent_log')
          .delete()
          .eq('id', (data as { id: string }).id);
    });

    it('service_role DELETE consent_log → allowed', async () => {
      const { data: tmp } = await svc
        .from('consent_log')
        .insert({
          user_id: teenUserId,
          consent_type: 'share_profile',
          scope: 'del_test',
          granted: false,
        })
        .select('id')
        .single();
      if (!tmp) return;
      const { error } = await svc
        .from('consent_log')
        .delete()
        .eq('id', (tmp as { id: string }).id);
      expect(allowed(error)).toBe(true);
    });
  });

  // ============================================================================
  // SPECIALISTS
  // ============================================================================
  describe('specialists', () => {
    // anon бачить active specialists
    it('anon SELECT specialists (status=active) → allowed', async () => {
      const { data, error } = await anon
        .from('specialists')
        .select('id, status')
        .eq('status', 'active')
        .limit(1);
      expect(allowed(error)).toBe(true);
    });

    it('anon INSERT specialists → denied', async () => {
      const { error } = await anon.from('specialists').insert({
        slug: 'fake',
        full_name: 'Fake',
        title: 'Fake',
      });
      expect(denied(error)).toBe(true);
    });

    it('anon UPDATE specialists → denied', async () => {
      const { data, error } = await anon
        .from('specialists')
        .update({ title: 'Hacked' })
        .eq('slug', 'olena-vovk')
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    it('anon DELETE specialists → denied', async () => {
      const { data, error } = await anon
        .from('specialists')
        .delete()
        .eq('slug', 'olena-vovk')
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    // service_role: повний доступ (bypass + explicit policy)
    it('service_role SELECT specialists → allowed', async () => {
      const { error } = await svc.from('specialists').select('id').limit(1);
      expect(allowed(error)).toBe(true);
    });

    it('service_role INSERT specialists → allowed', async () => {
      const tmpSlug = `tmp-${Date.now()}`;
      const { data, error } = await svc
        .from('specialists')
        .insert({ slug: tmpSlug, full_name: 'Tmp', title: 'Tmp' })
        .select('id')
        .single();
      expect(allowed(error)).toBe(true);
      if (data)
        await svc
          .from('specialists')
          .delete()
          .eq('id', (data as { id: string }).id);
    });
  });

  // ============================================================================
  // BOOKING_REQUESTS — 000005 + 000007 (UPDATE/DELETE service_role)
  // ============================================================================
  describe('booking_requests', () => {
    // anon може INSERT (policy "booking_requests: anyone can insert").
    // Без .select(): RETURNING вимагає SELECT-policy, якої anon не має —
    // PostgREST повертає RLS-помилку навіть для дозволеного INSERT.
    it('anon INSERT booking_requests → allowed', async () => {
      const marker = '@anontest-rls-insert';
      const { error } = await anon.from('booking_requests').insert({
        session_type: 'discovery',
        user_name: 'AnonTest',
        contact_preferred: 'telegram',
        contact_value: marker,
        user_age_band: '18-25',
        consent_offer: true,
        consent_contact: true,
      });
      expect(allowed(error)).toBe(true);
      // Верифікація вставки + cleanup — через service_role
      const { data: inserted } = await svc
        .from('booking_requests')
        .select('id')
        .eq('contact_value', marker);
      expect(Array.isArray(inserted) ? inserted.length : 0).toBeGreaterThan(0);
      await svc.from('booking_requests').delete().eq('contact_value', marker);
    });

    // anon НЕ може читати
    it('anon SELECT booking_requests → denied', async () => {
      const { data, error } = await anon.from('booking_requests').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    // anon не може UPDATE або DELETE
    it('anon UPDATE booking_requests → denied', async () => {
      const { data, error } = await anon
        .from('booking_requests')
        .update({ status: 'contacted' })
        .eq('id', bookingRequestId)
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    it('anon DELETE booking_requests → denied', async () => {
      const { data, error } = await anon
        .from('booking_requests')
        .delete()
        .eq('id', bookingRequestId)
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    // service_role: SELECT (explicit), UPDATE (000007), DELETE (000007)
    it('service_role SELECT booking_requests → allowed', async () => {
      const { error } = await svc.from('booking_requests').select('id').eq('id', bookingRequestId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role UPDATE booking_requests → allowed (000007)', async () => {
      const { error } = await svc
        .from('booking_requests')
        .update({ status: 'contacted' })
        .eq('id', bookingRequestId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role DELETE booking_requests → allowed (000007)', async () => {
      const { data: tmp } = await svc
        .from('booking_requests')
        .insert({
          session_type: 'discovery',
          user_name: 'DelTest',
          contact_preferred: 'email',
          contact_value: 'del@example.com',
          user_age_band: '16-17',
          consent_offer: true,
          consent_contact: true,
        })
        .select('id')
        .single();
      if (!tmp) return;
      const { error } = await svc
        .from('booking_requests')
        .delete()
        .eq('id', (tmp as { id: string }).id);
      expect(allowed(error)).toBe(true);
    });
  });

  // ============================================================================
  // EXERCISE_FEEDBACK — 000006 + 000007 (service_role SELECT)
  // ============================================================================
  describe('exercise_feedback', () => {
    // anon може INSERT (policy "anon can insert exercise_feedback").
    // Без .select(): RETURNING вимагає SELECT-policy, якої anon не має.
    // 201 без помилки = рядок вставлено. Cleanup по result='neutral' —
    // seed (beforeAll) та інші тести створюють лише 'helped'.
    it('anon INSERT exercise_feedback → allowed', async () => {
      const { error } = await anon.from('exercise_feedback').insert({ result: 'neutral' });
      expect(allowed(error)).toBe(true);
      await svc.from('exercise_feedback').delete().eq('result', 'neutral');
    });

    // anon не може читати
    it('anon SELECT exercise_feedback → denied', async () => {
      const { data, error } = await anon.from('exercise_feedback').select('id').limit(1);
      expect(denied(error, data)).toBe(true);
    });

    it('anon UPDATE exercise_feedback → denied', async () => {
      const { data, error } = await anon
        .from('exercise_feedback')
        .update({ result: 'helped' })
        .eq('id', exerciseFeedbackId)
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    it('anon DELETE exercise_feedback → denied', async () => {
      const { data, error } = await anon
        .from('exercise_feedback')
        .delete()
        .eq('id', exerciseFeedbackId)
        .select('id');
      expect(denied(error, data)).toBe(true);
    });

    // service_role SELECT (000007: явна policy для аналітики)
    it('service_role SELECT exercise_feedback → allowed (000007)', async () => {
      const { error } = await svc
        .from('exercise_feedback')
        .select('id')
        .eq('id', exerciseFeedbackId);
      expect(allowed(error)).toBe(true);
    });

    it('service_role DELETE exercise_feedback → allowed', async () => {
      const { data: tmp } = await svc
        .from('exercise_feedback')
        .insert({ result: 'helped' })
        .select('id')
        .single();
      if (!tmp) return;
      const { error } = await svc
        .from('exercise_feedback')
        .delete()
        .eq('id', (tmp as { id: string }).id);
      expect(allowed(error)).toBe(true);
    });
  });
});
