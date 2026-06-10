// /specialists/[slug] — детальний профіль фахівця.
// Спеціфікація: Phase F · v1.1, F3.

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Send, Mail, FileText } from 'lucide-react';
import { cn } from '@ya-ye/ui';
import { getSpecialistBySlug } from '@/lib/specialists';
import { SessionTypeCard } from '@/components/specialists/SessionTypeCard';

export default async function SpecialistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getSpecialistBySlug(slug);
  if (!s) notFound();

  return (
    <main className="min-h-[100dvh] bg-bg">
      {/* Back link */}
      <div className="border-b border-divider px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link
            href={'/specialists' as `/specialists`}
            className="inline-flex items-center gap-1 font-sans text-sm text-inkSoft transition-colors hover:text-ink"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            Усі фахівці
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 md:py-12">
        {/* HERO: фото + ім'я + hero-quote */}
        <section className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-divider md:w-64 md:shrink-0">
            <Image
              src={s.photoUrl}
              alt={s.photoAlt}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
              style={{ objectPosition: 'center 30%' }}
              priority
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-serif text-3xl italic text-ink md:text-4xl">{s.fullName}</h1>
            <p className="mt-1 font-sans text-base text-inkSoft">{s.title}</p>
            {s.subtitle && (
              <p className="font-mono text-xs uppercase tracking-wider text-accent">{s.subtitle}</p>
            )}

            {/* Hero-quote — виокремлено accent-кольором */}
            <blockquote className="mt-5 border-l-2 border-accent pl-4 font-serif text-xl italic leading-snug text-accent md:text-2xl">
              «{s.heroQuote}»
            </blockquote>
          </div>
        </section>

        {/* Quick facts */}
        <section className="mt-10 grid gap-3 rounded-2xl bg-bgSoft p-5 md:grid-cols-2">
          <Fact label="Спеціалізація" value={s.specializations.join(', ')} />
          <Fact label="Робота з" value={s.worksWith.join(', ')} />
          <Fact label="Освіта" value={s.education} />
          <Fact label="Підвищення кваліфікації" value={s.certifications} />
        </section>

        {/* Про мене */}
        <section className="mt-12 space-y-4">
          <h2 className="font-serif text-2xl italic text-ink">про мене</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed text-ink">
            {s.bioParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Methodology connection */}
        <section className="mt-12 space-y-4 rounded-3xl border-l-4 border-accent bg-bgSoft px-6 py-6">
          <h2 className="font-serif text-xl italic text-ink">Мій зв&apos;язок з «Я Є»</h2>
          <p className="font-sans text-base leading-relaxed text-ink">{s.methodologyConnection}</p>
          <p className="font-sans text-sm leading-relaxed text-inkSoft">
            Це означає: коли ми зустрінемось на сесії, я вже знаю рамку, у якій ти думав(ла) до
            зустрічі. Ми починаємо не з нуля. Це <strong>економить час</strong> і дає{' '}
            <strong>глибший старт</strong> — особливо якщо хочеш обговорити конкретний епізод з
            AI-розмови.
          </p>
        </section>

        {/* Session types */}
        <section className="mt-12 space-y-4">
          <h2 className="font-serif text-2xl italic text-ink">типи сесій</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {s.sessionTypes.map((session) => (
              <SessionTypeCard key={session.type} specialistSlug={s.slug} session={session} />
            ))}
          </div>
        </section>

        {/* Contact methods */}
        <section className="mt-12 space-y-4">
          <h2 className="font-serif text-2xl italic text-ink">як зв&apos;язатись</h2>
          <p className="font-sans text-sm leading-relaxed text-inkSoft">
            Можеш обрати найзручніший спосіб. Для деяких легше написати у месенджер, ніж заповнювати
            форму. Це нормально.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Telegram — primary */}
            {s.telegramUsername && (
              <ContactMethod
                primary
                title="Telegram"
                badge="часто обирають"
                handle={`@${s.telegramUsername}`}
                href={`https://t.me/${s.telegramUsername}`}
                ctaText="Написати в Telegram →"
                disclaimer={s.telegramDisclaimer ?? ''}
                icon={<Send size={16} strokeWidth={1.5} />}
                external
              />
            )}

            {/* Email — secondary */}
            {s.email && (
              <ContactMethod
                title="Email"
                handle={s.email}
                href={`mailto:${s.email}?subject=Запис на сесію через «Я Є»`}
                ctaText="Написати на email →"
                disclaimer={s.emailDisclaimer ?? ''}
                icon={<Mail size={16} strokeWidth={1.5} />}
              />
            )}

            {/* Form — tertiary */}
            <ContactMethod
              title="Форма запису"
              handle="через сторінку booking"
              href={`/specialists/${s.slug}/book/discovery`}
              ctaText="Залишити заявку →"
              disclaimer="реальне бронювання запрацює після інтеграції з Cal.com"
              icon={<FileText size={16} strokeWidth={1.5} />}
            />
          </div>
        </section>

        {/* Testimonials placeholder */}
        <section className="mt-12 rounded-3xl bg-bgSoft p-6">
          <h2 className="font-serif text-xl italic text-ink">що кажуть клієнти</h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-inkSoft">
            Тут будуть відгуки клієнтів — додамо після кількох сесій у форматі «Я Є» (з письмовою
            згодою кожного).
          </p>
          <p className="mt-2 font-sans text-xs italic leading-relaxed text-inkSoft">
            Зараз ми у Demo-стадії. Перші 3-5 клієнтів — це дослідницька когорта, з якою ми працюємо
            особливо уважно.
          </p>
        </section>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-inkSoft">{label}</p>
      <p className="mt-0.5 font-sans text-sm text-ink">{value}</p>
    </div>
  );
}

interface ContactMethodProps {
  primary?: boolean;
  title: string;
  badge?: string;
  handle: string;
  href: string;
  ctaText: string;
  disclaimer: string;
  icon: React.ReactNode;
  external?: boolean;
}

function ContactMethod({
  primary = false,
  title,
  badge,
  handle,
  href,
  ctaText,
  disclaimer,
  icon,
  external = false,
}: ContactMethodProps) {
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <article
      className={cn(
        'flex flex-col gap-2 rounded-2xl p-5',
        primary ? 'border-2 border-accent bg-accent/5' : 'border border-divider bg-bgSoft',
      )}
    >
      <header className="flex items-center justify-between">
        <h3 className="font-sans text-base font-medium text-ink">{title}</h3>
        {badge && (
          <span className="rounded-lg bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
            {badge}
          </span>
        )}
      </header>

      <p className="font-mono text-sm text-ink break-all">{handle}</p>

      {disclaimer && (
        <p className="font-sans text-xs italic leading-relaxed text-inkSoft">{disclaimer}</p>
      )}

      <a
        href={href}
        {...externalProps}
        className={cn(
          'mt-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-sans text-sm transition-opacity active:opacity-80',
          primary ? 'bg-accent text-white' : 'border border-accent/40 bg-bg text-accent',
        )}
      >
        {icon}
        {ctaText}
      </a>
    </article>
  );
}
