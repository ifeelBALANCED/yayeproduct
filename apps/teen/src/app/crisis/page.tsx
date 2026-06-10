'use client';

import { useState } from 'react';
import { Phone, MessageSquare, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getHotlines } from '@ya-ye/method';
import { Grounding54321 } from '@/components/crisis/Grounding54321';
import { cn } from '@ya-ye/ui';

// Geo-routing: у Phase 3 jurisdiction береться з user profile
// Поки що UA за замовчуванням
const DEFAULT_JURISDICTION = 'UA';

export default function CrisisPage() {
  const hotlines = getHotlines(DEFAULT_JURISDICTION);
  const [showGrounding, setShowGrounding] = useState(false);

  return (
    <main className="min-h-[100dvh] bg-bg">
      {/* Хедер */}
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          href="/chat"
          className="rounded-xl p-1.5 text-inkSoft transition-colors hover:bg-bgSoft"
          aria-label="назад"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </Link>
        <span className="font-mono text-xs uppercase tracking-wider text-crisis">
          підтримка зараз
        </span>
      </header>

      <div className="px-5 pb-8 space-y-6">
        {/* Three-move logic: всі три кроки одночасно видимі */}
        <div className="space-y-1.5">
          {/* Крок 1: підтвердження присутності */}
          <p className="font-serif text-2xl italic text-ink">я чую тебе.</p>
          {/* Крок 2: пауза */}
          <p className="font-sans text-sm text-inkSoft">зроби паузу. ти не один(-а).</p>
        </div>

        {/* Крок 3: посів про живу людину — номери */}
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-crisis">
            живі люди готові слухати
          </p>
          {hotlines.map((hotline) => {
            const isChat = hotline.note.includes('чат') || hotline.note.includes('chat');
            return (
              <a
                key={hotline.number}
                href={`tel:${hotline.number.replace(/\s/g, '')}`}
                className="flex items-center gap-4 rounded-2xl border border-divider bg-bgSoft px-4 py-4 transition-colors hover:border-crisis/30 hover:bg-crisisSoft/40 active:opacity-80"
              >
                <div className={cn('rounded-xl p-2.5', isChat ? 'bg-accent/10' : 'bg-crisisSoft')}>
                  {isChat ? (
                    <MessageSquare size={20} strokeWidth={1.5} className="text-accent" />
                  ) : (
                    <Phone size={20} strokeWidth={1.5} className="text-crisis" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-base text-ink">{hotline.name}</p>
                  <p className="font-mono text-xs text-inkSoft">{hotline.note}</p>
                </div>
                <span className="font-mono text-xl font-medium text-crisis whitespace-nowrap">
                  {hotline.number}
                </span>
              </a>
            );
          })}
        </div>

        {/* Вправа заземлення */}
        <div className="rounded-3xl border border-divider bg-bgSoft">
          {showGrounding ? (
            <div className="px-5 py-5">
              <Grounding54321 onDone={() => setShowGrounding(false)} />
            </div>
          ) : (
            <button
              onClick={() => setShowGrounding(true)}
              className="flex w-full items-center justify-between px-5 py-4"
            >
              <div className="text-left">
                <p className="font-sans text-base text-ink">вправа 5-4-3-2-1</p>
                <p className="font-sans text-xs text-inkSoft">заземлення через відчуття</p>
              </div>
              <span className="font-mono text-sm text-inkSoft">→</span>
            </button>
          )}
        </div>

        {/* Якщо хочеш поговорити з фахівцем */}
        <div className="rounded-3xl border border-divider bg-bgSoft px-5 py-4">
          <p className="font-sans text-sm text-inkSoft">
            хочеш поговорити з реальним фахівцем?
          </p>
          <Link
            href="/specialists"
            className="mt-2 block font-sans text-sm text-accent underline-offset-2 hover:underline"
          >
            перша зустріч безкоштовна →
          </Link>
        </div>

        <p className="text-center font-sans text-xs text-inkSoft/50">
          команда продукту переглядає всі сигнали кризи для безпеки.
        </p>
      </div>
    </main>
  );
}
