// commands/submitBooking.ts — збереження заявки на сесію (CQRS-lite §2.1).
// PII: жодного console.log з контактними даними (S5 quality-gate).

import type { SupabaseClient } from '@supabase/supabase-js';

export type ContactChannel = 'telegram' | 'email';
export type BookingAgeBand = '13-15' | '16-17' | '18-25' | '25+';

export interface SubmitBookingDeps {
  supabase: SupabaseClient | null;
}

export interface SubmitBookingParams {
  specialistDbId: string | null; // null в demo-режимі
  sessionType: string;
  userName: string;
  contactPreferred: ContactChannel;
  contactValue: string;
  userAgeBand: BookingAgeBand;
  topic: string | null;
  aiExcerpt: string | null;
  consentOffer: boolean;
  consentContact: boolean;
}

export type SubmitBookingResult =
  | { kind: 'ok'; bookingId: string | null; persisted: boolean }
  | { kind: 'error'; status: number; error: string };

export async function submitBooking(
  params: SubmitBookingParams,
  deps: SubmitBookingDeps,
): Promise<SubmitBookingResult> {
  const { supabase } = deps;

  if (!supabase || !params.specialistDbId) {
    // Demo-режим: логуємо БЕЗ PII (лише slug/type для діагностики)
    console.log('[booking.submit] demo fallback', {
      sessionType: params.sessionType,
      ageBand: params.userAgeBand,
    });
    return { kind: 'ok', bookingId: null, persisted: false };
  }

  const { data: br, error: brErr } = await supabase
    .from('booking_requests')
    .insert({
      specialist_id: params.specialistDbId,
      session_type: params.sessionType,
      user_name: params.userName,
      contact_preferred: params.contactPreferred,
      contact_value: params.contactValue,
      user_age_band: params.userAgeBand,
      topic: params.topic ?? null,
      ai_excerpt: params.aiExcerpt ?? null,
      consent_offer: params.consentOffer,
      consent_contact: params.consentContact,
    })
    .select('id')
    .single();

  if (brErr || !br) {
    console.error('[submitBooking] insert failed');
    // Не блокуємо UX через збій DB — демо-флоу важливіший
    return { kind: 'ok', bookingId: null, persisted: false };
  }

  return { kind: 'ok', bookingId: (br as { id: string }).id, persisted: true };
}
