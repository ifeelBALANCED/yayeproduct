// Анонімне підтвердження володіння сесією (P0-5, docs/quality-gate.md §1).
// Продукт анонімний за дизайном — auth-акаунтів немає. Замість них:
// HMAC-підписаний токен sessionId у httpOnly-cookie, виданий сервером при
// створенні сесії. Stateless: БД-колонка не потрібна, перевірка — переобчислення
// підпису. Закриває IDOR на /api/chat і /api/sessions/[id]/messages.
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'yaye_session';
// Сесія продукту — 25 хв; доба покриває reload і повернення того ж дня.
const MAX_AGE_SEC = 60 * 60 * 24;

// Fail closed у production: без SESSION_TOKEN_SECRET токени не видаються
// і жодна перевірка не проходить. Dev-фолбек — лише для локального демо.
function getSecret(): string | null {
  const s = process.env.SESSION_TOKEN_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === 'production') return null;
  return 'dev-only-session-secret';
}

function sign(sessionId: string, secret: string): string {
  return createHmac('sha256', secret).update(sessionId).digest('hex');
}

// Зчитуємо raw-значення cookie без верифікації (для розділення читання/перевірки).
function readRawCookie(req: Request): string | undefined {
  return (req.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
}

export function buildSessionCookie(sessionId: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const value = `${sessionId}.${sign(sessionId, secret)}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

// hasSessionCookie — перевіряє лише наявність cookie (для 401 vs 403 семантики).
// true = cookie є (але може бути для іншої сесії); false = cookie взагалі відсутній.
export function hasSessionCookie(req: Request): boolean {
  return readRawCookie(req) !== undefined;
}

// readSessionCookie — зчитує sessionId з cookie БЕЗ верифікації підпису.
// Використовується для логування/діагностики. Для auth — тільки verifySessionCookie.
export function readSessionCookie(req: Request): string | null {
  const raw = readRawCookie(req);
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  return raw.slice(0, dot);
}

// verifySessionCookie — повна перевірка: cookie є + підпис валідний + sessionId збігається.
// Повертає false як для відсутнього cookie, так і для невірного підпису/sessionId.
// Для розрізнення 401/403 — викликай hasSessionCookie окремо перед цією функцією.
export function verifySessionCookie(req: Request, sessionId: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  const raw = readRawCookie(req);
  if (!raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return false;
  if (raw.slice(0, dot) !== sessionId) return false;
  const sig = raw.slice(dot + 1);
  const expected = sign(sessionId, secret);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
