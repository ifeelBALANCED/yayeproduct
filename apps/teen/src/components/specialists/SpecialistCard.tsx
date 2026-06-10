// Картка фахівця у directory. Клікабельна → /specialists/[slug].
// Показує: фото (з object-position center 30%), ім'я, title, теги,
// works-with, мови, contact-icons (TG/EMAIL/FORM).

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Specialist } from '@/lib/specialists';

interface SpecialistCardProps {
  specialist: Specialist;
  priority?: boolean; // для above-the-fold (LCP)
}

const CONTACT_ICON_LABEL: Record<string, { label: string; title: string }> = {
  telegram: { label: 'TG', title: 'Доступно через Telegram' },
  email: { label: 'EMAIL', title: 'Доступно через email' },
  form: { label: 'FORM', title: 'Доступна форма запису' },
};

export function SpecialistCard({ specialist: s, priority = false }: SpecialistCardProps) {
  return (
    <Link
      href={`/specialists/${s.slug}` as `/specialists/${string}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-divider bg-bgSoft transition-all hover:border-accent/40 active:opacity-90"
    >
      {/* Фото 4:3, object-position center 30% (фокус на очах) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-divider">
        <Image
          src={s.photoUrl}
          alt={s.photoAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          style={{ objectPosition: 'center 30%' }}
          priority={priority}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Ім'я + title */}
        <div>
          <h3 className="font-serif text-xl italic text-ink">{s.fullName}</h3>
          <p className="mt-0.5 font-sans text-sm text-inkSoft">{s.title}</p>
          {s.subtitle && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
              {s.subtitle}
            </p>
          )}
        </div>

        {/* Теги спеціалізації (макс 3) */}
        <div className="flex flex-wrap gap-1.5">
          {s.specializations.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-xl bg-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-inkSoft"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Мета: з ким і якою мовою */}
        <div className="space-y-0.5 font-sans text-xs text-inkSoft">
          <p>з {s.worksWith.join(', ')}</p>
          <p>{s.languages.join(', ')}</p>
        </div>

        {/* Іконки каналів */}
        <div className="flex gap-1.5">
          {s.contactMethods.map((m) => {
            const info = CONTACT_ICON_LABEL[m];
            if (!info) return null;
            return (
              <span
                key={m}
                title={info.title}
                className="rounded-lg bg-bg px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent"
              >
                {info.label}
              </span>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-auto flex items-center justify-between pt-2 font-sans text-sm text-accent">
          <span className="transition-opacity group-hover:opacity-80">Подивитись профіль</span>
          <ChevronRight size={16} strokeWidth={1.5} />
        </div>
      </div>
    </Link>
  );
}
