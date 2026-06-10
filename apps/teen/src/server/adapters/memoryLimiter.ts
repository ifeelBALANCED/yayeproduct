// adapters/memoryLimiter.ts — делегує існуючому lib/rate-limit.ts.
// In-memory лімітер: MVP-захист від cost-abuse.
// Розподілений лімітер (Upstash) — Phase 3 quality-gate борг.

import { rateLimit } from '@/lib/rate-limit';
import type { RateLimiterPort } from '@/server/ports/rateLimiter';

export class MemoryLimiterAdapter implements RateLimiterPort {
  allow(key: string, limit: number, windowMs: number): boolean {
    return rateLimit(key, limit, windowMs);
  }
}
