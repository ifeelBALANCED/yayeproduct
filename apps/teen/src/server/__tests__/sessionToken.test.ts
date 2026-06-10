// S1 unit-тести для lib/session-token.ts — 401/403 семантика (quality-gate §S5).

import { describe, it, expect } from 'vitest';
import {
  buildSessionCookie,
  hasSessionCookie,
  readSessionCookie,
  verifySessionCookie,
} from '../../lib/session-token';

const SESSION_ID = '44444444-4444-4444-4444-444444444444';
const OTHER_SESSION_ID = '55555555-5555-5555-5555-555555555555';

// Встановлюємо dev-secret через env (dev-фолбек: 'dev-only-session-secret').
// В тестах NODE_ENV !== 'production', тому dev-фолбек активний.

function makeRequestWithCookie(cookieHeader: string): Request {
  return new Request('http://localhost/api/test', {
    headers: { cookie: cookieHeader },
  });
}

function makeRequestWithoutCookie(): Request {
  return new Request('http://localhost/api/test');
}

describe('buildSessionCookie', () => {
  it('повертає непорожній рядок з cookie-атрибутами', () => {
    const cookie = buildSessionCookie(SESSION_ID);
    expect(cookie).toBeTruthy();
    expect(cookie).toContain('yaye_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('cookie містить sessionId у значенні', () => {
    const cookie = buildSessionCookie(SESSION_ID);
    expect(cookie).toContain(SESSION_ID);
  });
});

describe('hasSessionCookie', () => {
  it('повертає true коли cookie є', () => {
    const cookie = buildSessionCookie(SESSION_ID)!;
    // Витягуємо лише пару name=value
    const nameValue = cookie.split(';')[0]!;
    const req = makeRequestWithCookie(nameValue);
    expect(hasSessionCookie(req)).toBe(true);
  });

  it('повертає false коли cookie відсутній', () => {
    const req = makeRequestWithoutCookie();
    expect(hasSessionCookie(req)).toBe(false);
  });
});

describe('readSessionCookie', () => {
  it('повертає sessionId без верифікації підпису', () => {
    const cookie = buildSessionCookie(SESSION_ID)!;
    const nameValue = cookie.split(';')[0]!;
    const req = makeRequestWithCookie(nameValue);
    expect(readSessionCookie(req)).toBe(SESSION_ID);
  });

  it('повертає null якщо cookie відсутній', () => {
    const req = makeRequestWithoutCookie();
    expect(readSessionCookie(req)).toBeNull();
  });
});

describe('verifySessionCookie', () => {
  it('повертає true для валідного cookie цієї сесії', () => {
    const cookie = buildSessionCookie(SESSION_ID)!;
    const nameValue = cookie.split(';')[0]!;
    const req = makeRequestWithCookie(nameValue);
    expect(verifySessionCookie(req, SESSION_ID)).toBe(true);
  });

  it('повертає false коли cookie відсутній (→ 401)', () => {
    const req = makeRequestWithoutCookie();
    expect(verifySessionCookie(req, SESSION_ID)).toBe(false);
    // hasSessionCookie теж false → route повертає 401
    expect(hasSessionCookie(req)).toBe(false);
  });

  it('повертає false коли cookie від іншої сесії (→ 403)', () => {
    // Cookie виданий для OTHER_SESSION_ID, але перевіряємо для SESSION_ID.
    const cookie = buildSessionCookie(OTHER_SESSION_ID)!;
    const nameValue = cookie.split(';')[0]!;
    const req = makeRequestWithCookie(nameValue);
    // hasSessionCookie = true (cookie є), але verify = false (→ 403)
    expect(hasSessionCookie(req)).toBe(true);
    expect(verifySessionCookie(req, SESSION_ID)).toBe(false);
  });

  it('повертає false для підробленого підпису', () => {
    const req = makeRequestWithCookie(`yaye_session=${SESSION_ID}.invalidsignature`);
    expect(verifySessionCookie(req, SESSION_ID)).toBe(false);
  });

  it('повертає false для cookie без крапки', () => {
    const req = makeRequestWithCookie(`yaye_session=noseparator`);
    expect(verifySessionCookie(req, SESSION_ID)).toBe(false);
  });
});
