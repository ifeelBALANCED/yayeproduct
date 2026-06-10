// Картка типу сесії (discovery / thematic / full) на profile-сторінці.
// Recommended badge на "тематичній" як defaultивний вибір.

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@ya-ye/ui';
import type { SessionOffering } from '@/lib/specialists';

interface SessionTypeCardProps {
  specialistSlug: string;
  session: SessionOffering;
}

export function SessionTypeCard({ specialistSlug, session: s }: SessionTypeCardProps) {
  return (
    <Link
      href={
        `/specialists/${specialistSlug}/book/${s.type}` as `/specialists/${string}/book/${string}`
      }
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl p-5 transition-all active:opacity-90',
        s.recommended
          ? 'border-2 border-accent bg-accent/5'
          : 'border border-divider bg-bgSoft hover:border-accent/30',
      )}
    >
      {s.recommended && (
        <span className="absolute right-4 top-4 rounded-lg bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
          часто обирають
        </span>
      )}

      <div>
        <h3 className="font-serif text-xl italic text-ink">{s.title}</h3>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-inkSoft">
          {s.durationLabel} · {s.priceText}
        </p>
      </div>

      <p className="flex-1 font-sans text-sm leading-relaxed text-inkSoft">{s.description}</p>

      <div className="mt-2 flex items-center justify-between font-sans text-sm text-accent">
        <span className="transition-opacity group-hover:opacity-80">
          {s.type === 'discovery' ? 'Записатись безкоштовно' : 'Записатись'}
        </span>
        <ChevronRight size={16} strokeWidth={1.5} />
      </div>
    </Link>
  );
}
