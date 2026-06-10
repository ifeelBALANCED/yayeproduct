// /specialists/[slug]/book/[sessionType]/success — підтвердження заявки.
// Спеціфікація: Phase F · v1.1, F4.

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Island } from '@ya-ye/ui';
import { getSpecialistBySlug, getSessionType } from '@/lib/specialists';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string; sessionType: string }>;
  // ?ch=telegram|email — який канал юзер обрав у формі
  searchParams: Promise<{ ch?: string }>;
}

export default async function BookingSuccessPage({ params, searchParams }: PageProps) {
  const { slug, sessionType } = await params;
  const { ch } = await searchParams;

  const specialist = getSpecialistBySlug(slug);
  const session = specialist ? getSessionType(specialist, sessionType) : undefined;
  if (!specialist || !session) notFound();

  const channelLabel = ch === 'telegram' ? 'Telegram' : 'email';
  const firstName = specialist.fullName.split(' ')[0] ?? specialist.fullName;

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        {/* Mini-island як візуальний акцент */}
        <div className="flex justify-center">
          <Island variant="mini" />
        </div>

        <div className="mt-6 space-y-3 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">заявка прийнята</p>
          <h1 className="font-serif text-4xl italic text-ink md:text-5xl">Дякуємо!</h1>
          <p className="mx-auto max-w-md font-sans text-base leading-relaxed text-inkSoft">
            Твоя заявка на <strong className="text-ink">{session.title}</strong> з{' '}
            {specialist.fullName} прийнята. {firstName} особисто зв&apos;яжеться з тобою через{' '}
            {channelLabel} протягом 24-48 годин (у робочі дні).
          </p>
        </div>

        {/* Що буде далі */}
        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl italic text-ink">що буде далі</h2>
          <ol className="space-y-3">
            <NextStep
              n="1"
              text={
                <>
                  <strong className="text-ink">Перевір {channelLabel}</strong> протягом 1-2 робочих
                  днів — {firstName} напише з кількома варіантами часу.
                </>
              }
            />
            <NextStep
              n="2"
              text={
                <>
                  <strong className="text-ink">Обери час</strong>, який тобі підходить — і отримаєш
                  посилання на відеодзвінок (Whereby або Zoom).
                </>
              }
            />
            <NextStep
              n="3"
              text={
                <>
                  <strong className="text-ink">До сесії</strong> ти можеш повернутись у чат з AI —
                  деяким підліткам це допомагає підготувати думки.
                </>
              }
            />
          </ol>
        </section>

        {/* CTA */}
        <div className="mt-10 space-y-3">
          <Link
            href={'/' as `/`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-sans text-base font-medium text-white transition-opacity active:opacity-80"
          >
            Повернутись у чат
            <ChevronRight size={18} strokeWidth={1.5} />
          </Link>
          <Link
            href={'/specialists' as `/specialists`}
            className="block w-full rounded-2xl border border-divider bg-bgSoft py-4 text-center font-sans text-base text-ink transition-colors hover:bg-bg active:opacity-80"
          >
            Подивитись інших фахівців
          </Link>
        </div>

        {/* Fallback contact */}
        <div className="mt-10 rounded-2xl bg-bgSoft px-5 py-4 text-center">
          <p className="font-sans text-sm leading-relaxed text-inkSoft">
            Якщо протягом 2 робочих днів не отримаєш відповіді — напиши нам на{' '}
            <a
              href="mailto:hello@ya-ye.app"
              className="text-accent underline-offset-2 hover:underline"
            >
              hello@ya-ye.app
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

function NextStep({ n, text }: { n: string; text: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-divider bg-bgSoft p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-mono text-xs text-accent">
        {n}
      </span>
      <p className="flex-1 font-sans text-sm leading-relaxed text-ink">{text}</p>
    </li>
  );
}
