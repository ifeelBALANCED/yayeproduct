// Placeholder-картка у directory для "майбутніх фахівців".
// Чесний empty-state — не «coming soon», а пояснення стану.

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SpecialistPlaceholderProps {
  message: string;
  cta: string;
  href: string;
}

export function SpecialistPlaceholder({ message, cta, href }: SpecialistPlaceholderProps) {
  // Зовнішній лінк (mailto: тощо) відкриваємо через <a>, internal — через <Link>
  const isExternal = href.startsWith('mailto:') || href.startsWith('http');
  const className =
    'group flex flex-col gap-4 rounded-2xl border border-dashed border-divider bg-bg p-5 transition-colors hover:border-accent/40';

  const content = (
    <>
      <p className="font-sans text-sm leading-relaxed text-inkSoft">
        {message}
      </p>
      <div className="mt-auto flex items-center justify-between font-sans text-sm text-accent">
        <span className="transition-opacity group-hover:opacity-80">{cta}</span>
        <ChevronRight size={16} strokeWidth={1.5} />
      </div>
    </>
  );

  return isExternal ? (
    <a href={href} className={className}>{content}</a>
  ) : (
    <Link href={href as `/${string}`} className={className}>{content}</Link>
  );
}
