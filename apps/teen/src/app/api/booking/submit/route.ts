// POST /api/booking/submit — приймає заявку на сесію (Phase F).
// Якщо Supabase сконфігурований — зберігає у booking_requests.
// Якщо ні — повертає success: true з persisted: false (демо не ламається),
// плюс друкує лог щоб бачити заявку у термінальному outputi.
//
// Структура запиту повністю відповідає колонкам booking_requests з міграції 005.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSpecialistBySlug, getSessionType } from '@/lib/specialists';

interface SubmitBody {
  specialist_slug?: string;
  session_type?: string;
  user_name?: string;
  contact_preferred?: 'telegram' | 'email';
  contact_value?: string;
  user_age_band?: '13-15' | '16-17' | '18-25' | '25+';
  topic?: string | null;
  ai_excerpt?: string | null;
  consent_offer?: boolean;
  consent_contact?: boolean;
}

const VALID_AGE_BANDS = ['13-15', '16-17', '18-25', '25+'] as const;
const VALID_CHANNELS = ['telegram', 'email'] as const;

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Валідація необхідних полів
  const errors: string[] = [];
  if (!body.specialist_slug?.trim()) errors.push('specialist_slug missing');
  if (!body.session_type?.trim()) errors.push('session_type missing');
  if (!body.user_name?.trim() || body.user_name.trim().length < 2) errors.push('user_name invalid');
  if (!body.contact_preferred || !VALID_CHANNELS.includes(body.contact_preferred)) {
    errors.push('contact_preferred invalid');
  }
  if (!body.contact_value?.trim() || body.contact_value.trim().length < 3) {
    errors.push('contact_value invalid');
  }
  if (!body.user_age_band || !VALID_AGE_BANDS.includes(body.user_age_band)) {
    errors.push('user_age_band invalid');
  }
  if (body.consent_offer !== true) errors.push('consent_offer required');
  if (body.consent_contact !== true) errors.push('consent_contact required');

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'validation failed', details: errors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Перевіряємо що фахівець + sessionType існують у нашому TS-каталозі
  const specialist = getSpecialistBySlug(body.specialist_slug!);
  const session = specialist ? getSessionType(specialist, body.session_type!) : undefined;
  if (!specialist || !session) {
    return new Response(
      JSON.stringify({ error: 'specialist or session type not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Fallback: Supabase не сконфігурований → друкуємо в лог, повертаємо success
  if (!isSupabaseConfigured()) {
    console.log('[booking.submit] (no DB — demo fallback)', {
      specialist: specialist.slug,
      session: session.type,
      name: body.user_name,
      channel: body.contact_preferred,
      contact: body.contact_value,
      age: body.user_age_band,
      topic: body.topic ?? null,
    });
    return new Response(
      JSON.stringify({ success: true, persisted: false }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Persistent шлях: треба знайти specialist_id за slug у БД
  const supabase = createClient();
  const { data: spRow, error: spErr } = await supabase
    .from('specialists')
    .select('id')
    .eq('slug', specialist.slug)
    .single();

  if (spErr || !spRow) {
    // Якщо Supabase сконфігурований, але specialists-таблиця не засіяна —
    // ми не блокуємо UX; падаємо в fallback
    console.warn('[booking.submit] specialist not found in DB, using fallback:', spErr?.message);
    return new Response(
      JSON.stringify({ success: true, persisted: false }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { data: br, error: brErr } = await supabase
    .from('booking_requests')
    .insert({
      specialist_id: spRow.id,
      session_type: body.session_type,
      user_name: body.user_name!.trim(),
      contact_preferred: body.contact_preferred,
      contact_value: body.contact_value!.trim(),
      user_age_band: body.user_age_band,
      topic: body.topic ?? null,
      ai_excerpt: body.ai_excerpt ?? null,
      consent_offer: body.consent_offer,
      consent_contact: body.consent_contact,
    })
    .select('id')
    .single();

  if (brErr || !br) {
    console.error('[booking.submit] insert failed:', brErr?.message);
    // Не показуємо юзеру технічну помилку — повертаємо success, бо
    // для нього demo-флоу важливіший за DB-аудит
    return new Response(
      JSON.stringify({ success: true, persisted: false }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // TODO Phase G: відправити нотифікацію Олені (Telegram bot або email)
  // TODO Phase G: відправити confirmation клієнту у обраний канал

  return new Response(
    JSON.stringify({ success: true, persisted: true, booking_id: br.id }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  );
}
