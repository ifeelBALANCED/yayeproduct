// /about-method — пояснення Я-острова з 4 шарами = 4 ФМ.
// Спеціфікація: Demo Day Sprint v2.1, Фаза B.

import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { Island, ISLAND_LAYERS } from '@ya-ye/ui';

const APP_BASE =
  process.env.NEXT_PUBLIC_TEEN_APP_URL?.replace(/^﻿/, '').trim() ||
  'https://yayeproduct-teen.vercel.app';

const LAYER_BG: Record<string, string> = {
  'island-foundation': 'bg-island-foundation/20',
  'island-bay': 'bg-island-bay/20',
  'island-rock': 'bg-island-rock/20',
  'island-lighthouse': 'bg-island-lighthouse/30',
};

export default function AboutMethodPage() {
  return (
    <main className="min-h-[100dvh] bg-bg text-ink">
      <header className="border-b border-divider px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link
            href="/"
            className="rounded-xl p-1.5 text-inkSoft transition-colors hover:bg-bgSoft"
            aria-label="На головну"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </Link>
          <h1 className="font-serif text-2xl italic text-ink">як ми думаємо про переживання</h1>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <h2 className="font-serif text-3xl italic text-ink md:text-4xl">хто або що я є?</h2>
        <p className="mt-6 max-w-2xl font-sans text-lg leading-relaxed text-inkSoft">
          Я — алгоритм. Не людина, не друг, не терапевт. Я не симулюю близькість і не
          прив&apos;язую. Я існую, щоб тримати простір — поки ти знайдеш живу людину.
        </p>
        <p className="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-inkSoft">
          Я-острів — це чотири шари того, як людина переживає себе у світі. Спирається на
          екзистенційний аналіз Альфріда Лєнгле — підхід, що питає не «що з тобою», а «де ти зараз».
        </p>

        <div className="mt-12 flex justify-center">
          <Island variant="explainer" />
        </div>
      </section>

      {/* 4 шари — окрема секція для кожного */}
      <div className="space-y-0">
        {ISLAND_LAYERS.map((layer, idx) => (
          <section key={layer.fm} className={`${LAYER_BG[layer.color]} px-6 py-16 md:py-20`}>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="font-mono text-xs uppercase tracking-wider text-inkSoft">
                ФМ{layer.fm} · {layer.metaphor}
              </p>
              <h2 className="font-serif text-3xl italic text-ink md:text-4xl">{layer.name}</h2>
              <p className="font-sans text-lg leading-relaxed text-ink">{layer.longText}</p>
              <p className="font-sans text-sm leading-relaxed text-inkSoft">
                приклади тем: <span className="text-ink">{layer.example}</span>
              </p>
            </div>
            {idx < ISLAND_LAYERS.length - 1 && (
              <div className="mx-auto mt-12 h-px max-w-3xl bg-divider/50" />
            )}
          </section>
        ))}
      </div>

      {/* Принциповий рядок */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-serif text-2xl italic leading-relaxed text-ink md:text-3xl">
          усі шари присутні завжди.
          <br />
          це не рівні, які проходять — <br />
          це структура, що тримає.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <a
          href={`${APP_BASE}/`}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-4 font-sans text-base font-medium text-white transition-opacity active:opacity-80"
        >
          Спробувати
          <ArrowRight size={18} strokeWidth={1.5} />
        </a>
      </section>
    </main>
  );
}
