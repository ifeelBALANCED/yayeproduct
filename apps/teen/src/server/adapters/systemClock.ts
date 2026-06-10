// adapters/systemClock.ts — реальна реалізація ClockPort через Date.now().

import type { ClockPort } from '@/server/ports/clock';

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}
