// Лендинг «Я Є» — Hero з одним CTA + Island + footer з crisis-лінком.
// Спеціфікація: Demo Day Sprint v2.1, Фаза A.
//
// Принципи (доc):
// — ОДИН primary CTA «Спробувати →» → /register (поки лінк на teen-app)
// — НЕ показуємо «Для фахівців» / «Для партнерів» окремими кнопками
// — AI disclosure видимий (не сховано малим шрифтом)
// — Trust line з даними у ЄС, без реклами
// — Crisis link у footer — safety, не маркетинг

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Island } from '@ya-ye/ui';
import { GroundingMinute } from './grounding-minute';

// Поки apps/landing не має власних маршрутів `/register`, `/crisis`, тощо —
// лінки ведуть на teen-app (Phase 2 MVP). У production буде sub-domain routing.
const APP_BASE =
  process.env.NEXT_PUBLIC_TEEN_APP_URL?.replace(/^﻿/, '').trim() ||
  'https://yayeproduct-teen.vercel.app';

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-bg text-ink">
      {/* ── HERO — fit one screen ── */}
      <section className="mx-auto flex h-[100dvh] max-w-6xl flex-col items-center gap-6 px-6 py-8 md:flex-row md:gap-12 md:py-10">
        <div className="flex flex-1 flex-col gap-4">
          <h1 className="font-serif text-4xl italic leading-tight text-ink md:text-5xl">
            Важко на душі — <br />а поговорити нема з ким?
          </h1>

          <p className="font-sans text-base leading-relaxed text-inkSoft">
            Я Є — простір де можна розібратися що відбувається. Без оцінок. Без порад. Просто
            розмова.
          </p>

          {/* EU AI Act Art. 50 */}
          <p className="font-sans text-xs leading-relaxed text-inkSoft">
            так, це алгоритм — не людина, не друг, не терапевт. він не симулює близькість і не
            прив&apos;язує. тільки тримає простір, щоб ти почув(ла) себе — і скеровує до живої
            людини, коли це важливо.
          </p>

          {/* Хвилина тут */}
          <GroundingMinute />

          {/* ОДИН CTA */}
          <div>
            <a
              href={`${APP_BASE}/`}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 font-sans text-sm font-medium text-white transition-opacity active:opacity-80"
            >
              Спробувати
              <ArrowRight size={16} strokeWidth={1.5} />
            </a>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-inkSoft">
              Без реклами. Дані в Європі, не продаються.
            </p>
          </div>
        </div>

        {/* Острів — праворуч на desktop, прихований на mobile */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <Island variant="hero" />
        </div>
      </section>

      {/* ── ЯК ЦЕ ПРАЦЮЄ ── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="font-serif text-3xl italic text-ink md:text-4xl">як це працює</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Step
            n="01"
            title="приходиш у розмову"
            text="одна сесія — 25 хвилин. без реєстрації, анонімно. жодних streaks і нагадувань."
          />
          <Step
            n="02"
            title="говориш як можеш"
            text="«Я Є» не вдає людину. слухає, віддзеркалює, ставить питання, які допомагають почути себе."
          />
          <Step
            n="03"
            title="ідеш з ясністю"
            text="не залишаєшся — продукт спроєктований так, щоб ти знайшов(ла) живу людину. або повернувся, коли треба."
          />
        </div>
      </section>

      {/* ── ЧИМ ВІДРІЗНЯЄМОСЬ (короткий блок) ── */}
      <section className="bg-bgSoft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="font-serif text-2xl italic text-ink md:text-3xl">чим відрізняємось</h2>
          <p className="font-sans text-base leading-relaxed text-inkSoft">
            Це не ChatGPT і не Replika. AI з рамкою екзистенційного аналізу — не симулює стосунки,
            не утримує. Тримає простір, поки знайдеш живу людину.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-divider px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-inkSoft">
            <Link href="/about-method" className="hover:text-ink hover:underline">
              Метод
            </Link>
            <Link href="/offer" className="hover:text-ink hover:underline">
              Оферта
            </Link>
            <Link href="/privacy" className="hover:text-ink hover:underline">
              Приватність
            </Link>
            <a href="mailto:hello@ya-ye.app" className="hover:text-ink hover:underline">
              Зв&apos;язатись
            </a>
          </nav>

          {/* Crisis link — обов'язково, не маркетинг */}
          <a
            href={`${APP_BASE}/crisis`}
            className="font-mono text-xs uppercase tracking-wider text-crisis hover:underline"
          >
            Зараз важко? →
          </a>
        </div>
      </footer>
    </main>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-divider bg-bgSoft px-5 py-6">
      <p className="font-mono text-xs uppercase tracking-wider text-inkSoft">{n}</p>
      <h3 className="mt-2 font-serif text-xl italic text-ink">{title}</h3>
      <p className="mt-3 font-sans text-sm leading-relaxed text-inkSoft">{text}</p>
    </div>
  );
}
