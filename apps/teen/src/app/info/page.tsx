import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const FAQ = [
  {
    q: 'хто або що ти?',
    a: 'я алгоритм. не людина, не психолог, не лікар. я можу відображати твої слова і ставити запитання, але не ставити діагнози і не давати медичних порад.',
  },
  {
    q: 'чи ти запам\'ятовуєш мене?',
    a: 'кожна сесія — 25 хвилин. після завершення я не зберігаю особисту інформацію довше, ніж потрібно. ти анонімний(-а) за замовчуванням.',
  },
  {
    q: 'що таке 25 хвилин?',
    a: 'це не обмеження — це дизайн. я існую, щоб тримати простір, поки ти знайдеш живу людину. 25 хвилин достатньо, щоб зробити крок.',
  },
  {
    q: 'що якщо мені зовсім погано?',
    a: 'якщо ти в кризі — натисни SOS у верхньому куті. там номери телефонів довіри, які працюють цілодобово і безкоштовно. живі люди готові слухати.',
  },
  {
    q: 'чи можу я поговорити з реальним психологом?',
    a: 'так. якщо під час розмови ти захочеш — я запропоную з\'єднати тебе з верифікованим фахівцем. перша зустріч безкоштовна.',
  },
  {
    q: 'хто стоїть за «Я Є»?',
    a: 'цей продукт розроблено за участю фахівців з ментального здоров\'я. методологія побудована так, щоб не замінювати живу допомогу, а вести до неї.',
  },
  {
    q: 'що зі збором даних?',
    a: 'мінімум даних, тільки на серверах у ЄС. жодного Google Analytics, жодного Facebook Pixel. у тебе є право видалити все — кнопка в налаштуваннях.',
  },
];

export default function InfoPage() {
  return (
    <main className="min-h-[100dvh] bg-bg">
      <header className="flex items-center gap-3 border-b border-divider px-4 py-4">
        <Link
          href="/"
          className="rounded-xl p-1.5 text-inkSoft transition-colors hover:bg-bgSoft"
          aria-label="назад"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </Link>
        <h1 className="font-serif text-xl italic text-ink">як я працюю</h1>
      </header>

      <div className="px-5 py-6">
        {/* AI disclosure — EU AI Act Article 50 */}
        <div className="mb-8 rounded-3xl border border-divider bg-bgSoft p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-inkSoft">
            я є AI · не людина
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-inkSoft">
            я алгоритм. я не можу замінити живу людину, не маю власних почуттів і не пам'ятаю
            тебе між сесіями. я тут, щоб тримати простір — не заповнювати порожнечу.
          </p>
        </div>

        <div className="space-y-1">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-2xl border border-divider bg-bgSoft"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-sans text-base text-ink">
                {q}
                <span className="font-mono text-xs text-inkSoft transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-5 pb-4 font-sans text-sm leading-relaxed text-inkSoft">
                {a}
              </p>
            </details>
          ))}
        </div>

        {/* SOS блок внизу */}
        <div className="mt-8 rounded-3xl border border-crisisSoft bg-crisisSoft/50 p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-crisis">
            якщо зараз дуже важко
          </p>
          <p className="mt-1 font-sans text-sm text-inkSoft">
            дитяча лінія довіри:{' '}
            <a
              href="tel:116111"
              className="font-mono text-crisis underline-offset-2 hover:underline"
            >
              116 111
            </a>
            {' '}· безкоштовно · цілодобово
          </p>
        </div>
      </div>
    </main>
  );
}
