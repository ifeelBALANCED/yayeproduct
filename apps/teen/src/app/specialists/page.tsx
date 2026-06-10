// /specialists — directory верифікованих фахівців.
// Спеціфікація: Phase F · v1.1, F2.

import Link from 'next/link';
import { SPECIALISTS } from '@/lib/specialists';
import { SpecialistCard } from '@/components/specialists/SpecialistCard';
import { SpecialistPlaceholder } from '@/components/specialists/SpecialistPlaceholder';

export default function SpecialistsPage() {
  return (
    <main className="min-h-[100dvh] bg-bg">
      {/* Header */}
      <header className="border-b border-divider px-6 py-8 md:py-12">
        <div className="mx-auto max-w-5xl space-y-3">
          <h1 className="font-serif text-3xl italic text-ink md:text-4xl">
            Фахівці, з якими ми працюємо
          </h1>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-inkSoft">
            Якщо ти готовий(а) до розмови з живою людиною — ось ті, кого ми
            перевірили методологічно. Можна почати з короткої 15-20 хвилинної
            зустрічі, без коммітменту на повний курс.
          </p>
        </div>
      </header>

      {/* «Як це працює» */}
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-mono text-xs uppercase tracking-wider text-inkSoft">
            як це працює
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Step n="1" title="Обери фахівця" text="Подивись профілі, обери, з ким резонує." />
            <Step n="2" title="Запиши на 15-20 хв" text="Discovery-call: знайомство і перевірка, чи комфортно з людиною." />
            <Step n="3" title="Вирішуй, що далі" text="Жодних зобов'язань. Подобається — продовжуй. Ні — пробуй з іншим." />
          </div>
        </div>
      </section>

      {/* Directory */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-mono text-xs uppercase tracking-wider text-inkSoft">
            доступні фахівці
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {SPECIALISTS.map((s, i) => (
              <SpecialistCard key={s.slug} specialist={s} priority={i === 0} />
            ))}
            <SpecialistPlaceholder
              message="Олена зараз набирає коло колег. Якщо ти фахівець з УСП — напиши нам."
              cta="Стати фахівцем →"
              href="mailto:hello@ya-ye.app?subject=Specialist application"
            />
            <SpecialistPlaceholder
              message="Незабаром тут з'явиться більше фахівців з різною спеціалізацією та доступністю."
              cta="Підписатись на оновлення →"
              href="mailto:hello@ya-ye.app?subject=Specialists update"
            />
          </div>
        </div>
      </section>

      {/* Trust block */}
      <section className="border-t border-divider bg-bgSoft px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="font-serif text-2xl italic text-ink">
            як ми обираємо фахівців
          </h2>
          <ul className="space-y-2 font-sans text-base leading-relaxed text-ink">
            <li>· Активна професійна практика з підлітками і молоддю</li>
            <li>· Підтверджена освіта та (за наявності) ліцензія</li>
            <li>· Робота у методології, сумісній з нашою рамкою</li>
            <li>· Готовність до short-format сесій (15-30 хв)</li>
            <li>· Згода з нашими принципами безпеки і конфіденційності</li>
          </ul>
          <p className="pt-2 font-sans text-sm leading-relaxed text-inkSoft">
            Наш methodology lead —{' '}
            <Link
              href={'/specialists/olena-vovk' as `/specialists/${string}`}
              className="text-accent underline-offset-2 hover:underline"
            >
              Олена Вовк
            </Link>
            {' '}— перевіряє кожного нового фахівця особисто.
          </p>
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-divider bg-bgSoft p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-accent">{n}</p>
      <h3 className="mt-2 font-sans text-base text-ink">{title}</h3>
      <p className="mt-1 font-sans text-sm leading-relaxed text-inkSoft">{text}</p>
    </div>
  );
}
