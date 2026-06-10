// GDPR Art. 7 consent log — реалізація у Phase 4 (борг §6 quality-gate).
// S5: rate limit + sanitized error — без internals у відповіді.

import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  if (!rateLimit(`consent:${clientIp(req)}`, 10, 60_000)) {
    return new Response(JSON.stringify({ error: 'too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'not implemented yet' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
}
