'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@ya-ye/ui';

const SESSION_DURATION_MS = 25 * 60 * 1000; // 25 хвилин
const WARNING_THRESHOLD_MS = 60 * 1000;      // попередження за 1 хвилину

interface SessionTimerProps {
  sessionId: string;
  startedAt: number; // timestamp ms
  onWarning?: () => void;
}

export function SessionTimer({ sessionId, startedAt, onWarning }: SessionTimerProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(SESSION_DURATION_MS);
  const [warned, setWarned] = useState(false);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startedAt;
    const rem = Math.max(0, SESSION_DURATION_MS - elapsed);
    setRemaining(rem);

    if (rem <= WARNING_THRESHOLD_MS && !warned) {
      setWarned(true);
      onWarning?.();
    }

    if (rem === 0) {
      // Route group (chat) не додає prefix — URL є просто /${sessionId}/exit
      router.push(`/${sessionId}/exit`);
    }
  }, [startedAt, warned, onWarning, router, sessionId]);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isWarning = remaining <= WARNING_THRESHOLD_MS;

  return (
    <span
      className={cn(
        'font-mono text-xs tabular-nums transition-colors',
        isWarning ? 'text-crisis' : 'text-inkSoft',
      )}
      aria-label={`залишилось ${minutes} хвилин ${seconds} секунд`}
      aria-live={isWarning ? 'assertive' : 'off'}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}
