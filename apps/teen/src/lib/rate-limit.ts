// In-memory sliding-window rate limiter (P0-5, docs/quality-gate.md §1).
// Per-instance: на serverless кожен інстанс має власний лічильник — це
// мінімальний MVP-захист від cost-abuse Anthropic, не повноцінний лімітер.
// Розподілений лімітер (Upstash/Redis) — Phase 2 quality-gate (S5).

const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  // Захист від необмеженого росту мапи (ключі = IP/sessionId від атакуючого)
  if (!buckets.has(key) && buckets.size >= MAX_KEYS) buckets.clear();
  buckets.set(key, hits);
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
