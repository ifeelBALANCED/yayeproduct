'use client';

// /specialists/[slug]/book/[sessionType] — booking-форма (mock).
// Спеціфікація: Phase F · v1.1, F3.

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Send, Mail } from 'lucide-react';
import { cn } from '@ya-ye/ui';
import { getSpecialistBySlug, getSessionType } from '@/lib/specialists';
import { CalendarMockup } from '@/components/specialists/CalendarMockup';

type AgeBand = '13-15' | '16-17' | '18-25' | '25+';
type ContactChannel = 'telegram' | 'email';

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string; sessionType: string }>;
}) {
  const { slug, sessionType } = use(params);
  const router = useRouter();

  const specialist = getSpecialistBySlug(slug);
  const session = specialist ? getSessionType(specialist, sessionType) : undefined;

  // Form state
  const [name, setName] = useState('');
  const [contactPreferred, setContactPreferred] = useState<ContactChannel>('telegram');
  const [contactValue, setContactValue] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand | ''>('');
  const [topic, setTopic] = useState('');
  const [aiExcerpt, setAiExcerpt] = useState('');
  const [consentOffer, setConsentOffer] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!specialist || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6">
        <p className="font-sans text-base text-inkSoft">Такого типу сесії не знайдено.</p>
      </main>
    );
  }

  const isMinor = ageBand === '13-15' || ageBand === '16-17';
  const isDiscovery = session.type === 'discovery';

  // Клієнтська email-валідація: якщо обрано email-канал, перевіряємо формат.
  // Той самий критерій, що і в BookingSubmitSchema (packages/contracts).
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contactValueValid =
    contactPreferred === 'email'
      ? EMAIL_RE.test(contactValue.trim())
      : contactValue.trim().length >= 3;

  const formValid =
    name.trim().length >= 2 &&
    contactValueValid &&
    ageBand !== '' &&
    consentOffer &&
    consentContact;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const r = await fetch('/api/booking/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialist_slug: slug,
          session_type: sessionType,
          user_name: name.trim(),
          contact_preferred: contactPreferred,
          contact_value: contactValue.trim(),
          user_age_band: ageBand,
          topic: topic.trim() || null,
          ai_excerpt: aiExcerpt.trim() || null,
          consent_offer: consentOffer,
          consent_contact: consentContact,
        }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(data.error ?? 'Не вдалось надіслати заявку. Спробуй ще раз.');
        setSubmitting(false);
        return;
      }
      router.push(
        `/specialists/${slug}/book/${sessionType}/success?ch=${contactPreferred}` as never,
      );
    } catch (err) {
      console.error('[booking] submit failed', err);
      setErrorMsg('Мережева помилка. Спробуй ще раз або напиши на email.');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Back */}
      <div className="border-b border-divider px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/specialists/${slug}` as `/specialists/${string}`}
            className="inline-flex items-center gap-1 font-sans text-sm text-inkSoft transition-colors hover:text-ink"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            Назад до профілю
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 md:py-12">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="font-serif text-3xl italic text-ink">записатись на сесію</h1>
          <p className="font-sans text-base text-inkSoft">
            <strong className="text-ink">{session.title}</strong> з {specialist.fullName} ·{' '}
            {session.durationLabel} · {session.priceText}
          </p>
        </header>

        {/* Demo notice */}
        <div className="mt-6 rounded-2xl border-l-4 border-accent bg-accent/5 px-5 py-4">
          <p className="font-sans text-sm leading-relaxed text-ink">
            <strong>Це demo-стадія продукту.</strong> Реальне бронювання запрацює після інтеграції з
            Cal.com. Зараз твоя заявка прийде {specialist.fullName.split(' ')[0]} особисто, і вона
            зв&apos;яжеться з тобою через обраний канал для узгодження часу.
          </p>
        </div>

        {/* Quick contact alternatives */}
        <section className="mt-8 space-y-3 rounded-2xl bg-bgSoft p-5">
          <p className="font-sans text-sm text-ink">
            <strong>Не хочеш заповнювати форму?</strong> Можна просто написати:
          </p>
          <div className="flex flex-wrap gap-2">
            {specialist.telegramUsername && (
              <a
                href={`https://t.me/${specialist.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 font-sans text-sm text-white transition-opacity active:opacity-80"
              >
                <Send size={14} strokeWidth={1.5} />
                Telegram @{specialist.telegramUsername}
              </a>
            )}
            {specialist.email && (
              <a
                href={`mailto:${specialist.email}?subject=Запис на ${session.title} через «Я Є»`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-bg px-4 py-2 font-sans text-sm text-accent transition-opacity active:opacity-80"
              >
                <Mail size={14} strokeWidth={1.5} />
                Email
              </a>
            )}
          </div>
        </section>

        {/* Calendar mockup */}
        <section className="mt-10 space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-inkSoft">
            обери час (мок)
          </h2>
          <CalendarMockup />
        </section>

        {/* Booking form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <h2 className="font-serif text-2xl italic text-ink">твої контакти</h2>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block font-sans text-sm text-ink">
              Ім&apos;я <span className="text-inkSoft">(або як до тебе звертатись)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-2xl border border-divider bg-bgSoft px-4 py-3 font-sans text-base text-ink placeholder:text-inkSoft/50 focus:border-accent/50 focus:outline-none"
            />
          </div>

          {/* Contact channel */}
          <div className="space-y-2">
            <label className="block font-sans text-sm text-ink">Зручний контакт</label>
            <div className="space-y-2">
              <RadioOption
                checked={contactPreferred === 'telegram'}
                onChange={() => setContactPreferred('telegram')}
                label="Telegram"
                hint="Олена напише першою"
                name="contact_preferred"
              />
              <RadioOption
                checked={contactPreferred === 'email'}
                onChange={() => setContactPreferred('email')}
                label="Email"
                name="contact_preferred"
              />
            </div>
          </div>

          {/* Contact value */}
          <div className="space-y-1.5">
            <label htmlFor="contact_value" className="block font-sans text-sm text-ink">
              {contactPreferred === 'telegram' ? 'Telegram username' : 'Email'}
            </label>
            <input
              id="contact_value"
              type={contactPreferred === 'email' ? 'email' : 'text'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              required
              placeholder={contactPreferred === 'telegram' ? '@username' : 'example@email.com'}
              className="w-full rounded-2xl border border-divider bg-bgSoft px-4 py-3 font-sans text-base text-ink placeholder:text-inkSoft/50 focus:border-accent/50 focus:outline-none"
            />
            {/* Підказка формату email — з'являється якщо введено некоректний email */}
            {contactPreferred === 'email' &&
              contactValue.trim().length > 0 &&
              !EMAIL_RE.test(contactValue.trim()) && (
                <p className="font-sans text-xs text-crisis" role="alert">
                  Введи коректний email, наприклад: name@example.com
                </p>
              )}
          </div>

          {/* Age band */}
          <div className="space-y-1.5">
            <label htmlFor="age_band" className="block font-sans text-sm text-ink">
              Скільки тобі років
            </label>
            <select
              id="age_band"
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value as AgeBand)}
              required
              className="w-full rounded-2xl border border-divider bg-bgSoft px-4 py-3 font-sans text-base text-ink focus:border-accent/50 focus:outline-none"
            >
              <option value="" disabled>
                Обери...
              </option>
              <option value="13-15">13-15</option>
              <option value="16-17">16-17</option>
              <option value="18-25">18-25</option>
              <option value="25+">старше 25</option>
            </select>
          </div>

          {/* Parental notice for minors */}
          {isMinor && (
            <div className="rounded-2xl border-l-4 border-accent bg-accent/5 px-5 py-4">
              <p className="font-sans text-sm leading-relaxed text-ink">
                <strong>Тобі ще немає 18 років.</strong> Для запису на сесію{' '}
                {specialist.fullName.split(' ')[0]} особисто обговорить з тобою цей крок. У разі
                повної сесії може знадобитись згода батьків або законних представників.
              </p>
            </div>
          )}

          {/* Topic */}
          <div className="space-y-1.5">
            <label htmlFor="topic" className="block font-sans text-sm text-ink">
              Що б ти хотів(ла) обговорити?{' '}
              <span className="text-inkSoft">(необов&apos;язково)</span>
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Наприклад: «розмова про сім'ю», «складно з друзями», «не знаю, з чого почати»..."
              className="w-full resize-none rounded-2xl border border-divider bg-bgSoft px-4 py-3 font-sans text-base text-ink placeholder:text-inkSoft/50 focus:border-accent/50 focus:outline-none"
            />
          </div>

          {/* AI excerpt — тільки для thematic */}
          {session.type === 'thematic' && (
            <div className="space-y-1.5">
              <label htmlFor="ai_excerpt" className="block font-sans text-sm text-ink">
                Фрагмент з твоєї розмови з AI{' '}
                <span className="text-inkSoft">(необов&apos;язково)</span>
              </label>
              <textarea
                id="ai_excerpt"
                value={aiExcerpt}
                onChange={(e) => setAiExcerpt(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Можеш скопіювати шматочок з чату, який хочеш обговорити. Ми передамо це Олені перед сесією."
                className="w-full resize-none rounded-2xl border border-divider bg-bgSoft px-4 py-3 font-sans text-base text-ink placeholder:text-inkSoft/50 focus:border-accent/50 focus:outline-none"
              />
            </div>
          )}

          {/* Consents */}
          <div className="space-y-3 pt-2">
            <Checkbox checked={consentOffer} onChange={setConsentOffer} required>
              Я погоджуюсь з{' '}
              <Link
                href={'/offer' as `/${string}`}
                className="text-accent underline-offset-2 hover:underline"
              >
                умовами використання
              </Link>{' '}
              <span className="text-inkSoft">(документ у розробці)</span>
            </Checkbox>
            <Checkbox checked={consentContact} onChange={setConsentContact} required>
              {specialist.fullName.split(' ')[0]} може зв&apos;язатись зі мною через обраний канал
              для узгодження часу
            </Checkbox>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="rounded-2xl border border-crisis/40 bg-crisisSoft/30 px-4 py-3">
              <p className="font-sans text-sm text-crisis">{errorMsg}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!formValid || submitting}
            className={cn(
              'flex w-full items-center justify-center rounded-2xl py-4 font-sans text-base font-medium transition-all',
              formValid && !submitting
                ? 'bg-accent text-white active:opacity-80'
                : 'bg-divider text-inkSoft',
            )}
          >
            {submitting ? 'надсилаємо…' : 'Залишити заявку'}
          </button>

          {/* Payment note */}
          <p className="font-sans text-sm leading-relaxed text-inkSoft">
            {isDiscovery ? (
              <>Discovery-call безкоштовний — оплата не потрібна.</>
            ) : (
              <>
                <strong className="text-ink">Оплата:</strong> Зараз ми не приймаємо платежі онлайн
                (Cal.com інтеграція в розробці). {specialist.fullName.split(' ')[0]} надішле тобі
                реквізити після підтвердження слоту.
              </>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}

function RadioOption({
  checked,
  onChange,
  label,
  hint,
  name,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  name: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors',
        checked ? 'border-accent bg-accent/5' : 'border-divider bg-bgSoft',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-accent"
      />
      <span className="flex-1">
        <span className="block font-sans text-sm text-ink">{label}</span>
        {hint && <span className="block font-sans text-xs text-inkSoft">{hint}</span>}
      </span>
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-1 h-4 w-4 accent-accent"
      />
      <span className="font-sans text-sm leading-relaxed text-ink">{children}</span>
    </label>
  );
}
