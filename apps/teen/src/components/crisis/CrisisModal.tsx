'use client';

import { useEffect, useRef } from 'react';
import { Phone, MessageSquare, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';
import type { Hotline } from '@ya-ye/method';
import { cn } from '@ya-ye/ui';

interface CrisisModalProps {
  hotlines: readonly Hotline[];
  onClose: () => void;
  onGrounding?: () => void;
}

export function CrisisModal({ hotlines, onClose, onGrounding }: CrisisModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstButton = dialogRef.current?.querySelector<HTMLElement>('button, a[href]');
    firstButton?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Кризова підтримка"
    >
      <div ref={dialogRef} className="rounded-t-3xl bg-bg shadow-sm">
        {/* Three-move: присутність + пауза + пояснення */}
        <div className="border-b border-divider px-5 pt-5 pb-4">
          <p className="font-sans text-base leading-relaxed text-ink">я чую тебе.</p>
          <p className="mt-1 font-sans text-sm text-inkSoft">зачекай — зроби паузу.</p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-inkSoft">
            тобі не потрібно нічого пояснювати — достатньо сказати{' '}
            <span className="text-ink">«мені дуже погано»</span>.
          </p>
        </div>

        {/* Секція А: Анонімна лінія */}
        <div className="px-5 pt-4 pb-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-crisis">
            анонімна лінія · не питатимуть деталей
          </p>
          <div className="space-y-2">
            {hotlines.map((hotline) => (
              <HotlineRow key={hotline.number} hotline={hotline} />
            ))}
          </div>
        </div>

        {/* Роздільник з питанням вибору */}
        <div className="px-5 py-2">
          <p className="font-sans text-xs text-inkSoft text-center">
            або поговоримо з фахівцем особисто?
          </p>
        </div>

        {/* Секція Б: Фахівець */}
        <div className="px-5 pb-4">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-accent">
            фахівець · перша розмова безкоштовна
          </p>
          <p className="mb-3 font-sans text-xs leading-relaxed text-inkSoft">
            починає з «як ти зараз» — не з того що трапилось. деталі — тільки якщо сам захочеш.
          </p>
          <Link
            href="/specialists"
            className="flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3.5 transition-colors hover:bg-accent/10 active:opacity-80"
          >
            <div className="rounded-xl bg-accent/10 p-2">
              <Users size={18} strokeWidth={1.5} className="text-accent" />
            </div>
            <p className="flex-1 font-sans text-sm text-ink">обрати фахівця</p>
            <ChevronRight size={16} strokeWidth={1.5} className="text-accent" />
          </Link>
        </div>

        <div className="border-t border-divider px-5 py-4 space-y-2">
          {onGrounding && (
            <button
              onClick={onGrounding}
              className="w-full rounded-2xl border border-divider bg-bgSoft py-3.5 font-sans text-sm text-inkSoft transition-colors hover:bg-bg active:opacity-80"
            >
              вправа заземлення 5-4-3-2-1
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-bgSoft py-3.5 font-sans text-sm text-inkSoft transition-colors hover:bg-divider active:opacity-80"
          >
            повернутись до розмови
          </button>
        </div>

        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}

function HotlineRow({ hotline }: { hotline: Hotline }) {
  const isChat = hotline.note.includes('чат') || hotline.note.includes('chat');

  return (
    <a
      href={`tel:${hotline.number.replace(/\s/g, '')}`}
      className="flex items-center gap-4 rounded-2xl border border-divider bg-bgSoft px-4 py-3.5 transition-colors hover:border-crisis/30 hover:bg-crisisSoft/30 active:opacity-80"
    >
      <div className={cn('rounded-xl p-2', isChat ? 'bg-accent/10' : 'bg-crisisSoft')}>
        {isChat ? (
          <MessageSquare size={18} strokeWidth={1.5} className="text-accent" />
        ) : (
          <Phone size={18} strokeWidth={1.5} className="text-crisis" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-ink">{hotline.name}</p>
        <p className="font-mono text-xs text-inkSoft">{hotline.note}</p>
      </div>
      <span className="font-mono text-base font-medium text-crisis whitespace-nowrap">
        {hotline.number}
      </span>
    </a>
  );
}
