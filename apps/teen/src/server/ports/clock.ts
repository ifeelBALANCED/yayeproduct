// ports/clock.ts — абстракція системного часу (DIP, quality-gate §2.1).
// Сервер є джерелом істини для часових міток (§2.4).
// У тестах замінюється фейком з фіксованим now().

export interface ClockPort {
  now(): Date;
}
