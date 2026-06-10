// /privacy — placeholder політики приватності. Текст у розробці.
// Принципи (з CLAUDE.md та canonical промта):
// — Дані на серверах в ЄС
// — Без Google Analytics, без Facebook Pixel
// — Право видалити все

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          <h1 className="font-serif text-2xl italic text-ink">
            Приватність
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12 md:py-16 space-y-8">
        <div className="space-y-5 rounded-3xl border-l-4 border-accent bg-bgSoft px-6 py-8 md:px-8">
          <p className="font-mono text-sm uppercase tracking-wider text-accent">
            Документ у розробці
          </p>

          <p className="font-sans text-base leading-relaxed text-ink">
            Повний текст політики приватності фіналізується разом з юристом
            до публічного запуску продукту.
          </p>

          <p className="font-sans text-base leading-relaxed text-ink">
            Принципи, які ми вже дотримуємо:
          </p>

          <ul className="space-y-2 font-sans text-base leading-relaxed text-ink">
            <li>· Дані зберігаються на серверах у Європі (eu-central-1).</li>
            <li>· Без Google Analytics, без Facebook Pixel, без рекламних трекерів.</li>
            <li>· Жоден третій бік не отримує твоїх повідомлень.</li>
            <li>· Ти анонімний(а) за замовчуванням — не запитуємо ім’я чи телефон.</li>
            <li>· Право видалити все — кнопка у налаштуваннях, без бюрократії.</li>
          </ul>
        </div>

        <p className="font-sans text-sm leading-relaxed text-inkSoft">
          Питання — пиши на{' '}
          <a
            href="mailto:hello@ya-ye.app"
            className="text-accent underline-offset-2 hover:underline"
          >
            hello@ya-ye.app
          </a>
        </p>

        <Link
          href="/"
          className="inline-block font-sans text-sm text-inkSoft underline-offset-2 hover:underline"
        >
          ← На головну
        </Link>
      </div>
    </main>
  );
}
