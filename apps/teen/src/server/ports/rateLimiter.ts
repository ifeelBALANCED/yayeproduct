// ports/rateLimiter.ts — абстракція rate-limiting (DIP, quality-gate §2.1).
// allow() повертає true якщо запит дозволений, false — якщо перевищено ліміт.
// У тестах замінюється фейком що завжди повертає true (або false для тесту 429).

export interface RateLimiterPort {
  allow(key: string, limit: number, windowMs: number): boolean;
}
