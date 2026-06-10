// Crisis detection + logging — реалізація у Phase 2 (борг §6 quality-gate).
// S5: rate limit + sanitized error — без internals у відповіді.
// runtime 'edge' видалено: edge не підтримує node:crypto (session-token).

import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  if (!rateLimit(`crisis:${clientIp(req)}`, 20, 60_000)) {
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
