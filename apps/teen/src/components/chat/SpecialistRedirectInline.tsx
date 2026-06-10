// SpecialistRedirectInline — inline-блок під реплікою AI, коли модель
// емітила маркер [MODE:4]. Дві опції:
//   - загальний directory /specialists
//   - прямий discovery-call з Оленою (15хв, безкоштовно)
// Обидва відкриваються у новій вкладці, чат-сесія лишається активною.
//
// Спеціфікація: Demo Day Sprint v2.1 (Mode 4 inline) + Phase F v1.1 (two-link update).

import { ArrowUpRight } from 'lucide-react';

export function SpecialistRedirectInline() {
  return (
    <aside
      className="my-2 space-y-3 rounded-r-xl border-l-2 border-accent bg-bgSoft px-4 py-3"
      role="complementary"
      aria-label="Рекомендація живого фахівця"
    >
      <p className="font-sans text-sm leading-relaxed text-inkSoft">
        тут є момент, де живий фахівець може бути корисний(а).
      </p>

      <div className="flex flex-col gap-2">
        <a
          href="/specialists"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-sans text-sm text-accent underline-offset-2 hover:underline"
        >
          Подивитись фахівців
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </a>
        <a
          href="/specialists/olena-vovk/book/discovery"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-sans text-sm text-accent underline-offset-2 hover:underline"
        >
          15-хв discovery-call з Оленою
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </a>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-wider text-inkSoft">
        не зобов&apos;язує. можна просто подивитись.
      </p>
    </aside>
  );
}
