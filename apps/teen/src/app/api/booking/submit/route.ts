// POST /api/booking/submit — тонкий Controller (CQRS-lite, quality-gate §2.1).
// S5 PII: жодного console.log з контактними даними (ім'я, контакт).
// Вся логіка збереження — у commands/submitBooking.ts.

import { BookingSubmitSchema } from '@ya-ye/contracts';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSpecialistBySlug, getSessionType } from '@/lib/specialists';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { submitBooking } from '@/server/commands/submitBooking';

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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError('invalid JSON', 400);
  }

  // Trim до валідації: '  a ' не має проходити min(2) за рахунок пробілів.
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    for (const key of ['user_name', 'contact_value'] as const) {
      if (typeof record[key] === 'string') record[key] = (record[key] as string).trim();
    }
  }

  // Валідація — єдине джерело правди: BookingSubmitSchema (@ya-ye/contracts, §2.4).
  const parsed = BookingSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    // S5 PII: у details лише шляхи полів, без введених значень.
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')} invalid`);
    return new Response(JSON.stringify({ error: 'validation failed', details }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const body = parsed.data;

  // Перевіряємо що фахівець + sessionType існують у TS-каталозі.
  const specialist = getSpecialistBySlug(body.specialist_slug);
  const session = specialist ? getSessionType(specialist, body.session_type) : undefined;
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
      sessionType: body.session_type,
      userName: body.user_name,
      contactPreferred: body.contact_preferred,
      contactValue: body.contact_value,
      userAgeBand: body.user_age_band,
      topic: body.topic ?? null,
      aiExcerpt: body.ai_excerpt ?? null,
      consentOffer: body.consent_offer,
      consentContact: body.consent_contact,
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
