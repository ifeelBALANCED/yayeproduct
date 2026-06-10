// POST /api/booking/submit — тонкий Controller (CQRS-lite, quality-gate §2.1).
// S5 PII: жодного console.log з контактними даними (ім'я, контакт).
// Вся логіка збереження — у commands/submitBooking.ts.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSpecialistBySlug, getSessionType } from '@/lib/specialists';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { submitBooking } from '@/server/commands/submitBooking';
import type { ContactChannel, BookingAgeBand } from '@/server/commands/submitBooking';

interface SubmitBody {
  specialist_slug?: string;
  session_type?: string;
  user_name?: string;
  contact_preferred?: ContactChannel;
  contact_value?: string;
  user_age_band?: BookingAgeBand;
  topic?: string | null;
  ai_excerpt?: string | null;
  consent_offer?: boolean;
  consent_contact?: boolean;
}

const VALID_AGE_BANDS: readonly BookingAgeBand[] = ['13-15', '16-17', '18-25', '25+'] as const;
const VALID_CHANNELS: readonly ContactChannel[] = ['telegram', 'email'] as const;

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  // Rate limit — захист від спаму заявок.
  if (!rateLimit(`booking:${clientIp(req)}`, 5, 60_000)) {
    return jsonError('too many requests', 429);
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return jsonError('invalid JSON', 400);
  }

  // Валідація необхідних полів.
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
    return new Response(JSON.stringify({ error: 'validation failed', details: errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Перевіряємо що фахівець + sessionType існують у TS-каталозі.
  const specialist = getSpecialistBySlug(body.specialist_slug!);
  const session = specialist ? getSessionType(specialist, body.session_type!) : undefined;
  if (!specialist || !session) {
    return jsonError('specialist or session type not found', 404);
  }

  // Шукаємо specialist_id у БД (якщо сконфігурована).
  let specialistDbId: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: spRow, error: spErr } = await supabase
      .from('specialists')
      .select('id')
      .eq('slug', specialist.slug)
      .single();

    if (spErr || !spRow) {
      console.warn('[booking.submit] specialist not found in DB');
      // Не блокуємо UX — падаємо в demo fallback нижче.
    } else {
      specialistDbId = (spRow as { id: string }).id;
    }
  }

  const supabase = isSupabaseConfigured() && specialistDbId ? createClient() : null;

  const result = await submitBooking(
    {
      specialistDbId,
      sessionType: body.session_type!,
      userName: body.user_name!.trim(),
      contactPreferred: body.contact_preferred!,
      contactValue: body.contact_value!.trim(),
      userAgeBand: body.user_age_band!,
      topic: body.topic ?? null,
      aiExcerpt: body.ai_excerpt ?? null,
      consentOffer: body.consent_offer!,
      consentContact: body.consent_contact!,
    },
    { supabase },
  );

  if (result.kind === 'error') {
    // Sanitized — без internals (S5).
    return jsonError('internal', 500);
  }

  return new Response(
    JSON.stringify({
      success: true,
      persisted: result.persisted,
      ...(result.bookingId ? { booking_id: result.bookingId } : {}),
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  );
}
