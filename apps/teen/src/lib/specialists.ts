// Single source of truth для фахівців. Дзеркало seed-у міграції 005.
// Коли Supabase Chunk B буде завершений — можна switch на DB-fetch
// через @ya-ye/db або supabase server client. Структура полів збігається
// з таблицею `specialists` точно один-до-одного.

export type SessionType = 'discovery' | 'thematic' | 'full';
export type ContactMethod = 'telegram' | 'email' | 'form';
export type SpecialistStatus = 'active' | 'paused' | 'archived';

export interface SessionOffering {
  type: SessionType;
  title: string;
  durationMin: number;
  durationLabel: string; // "15 хв"
  priceText: string; // "безкоштовно" | "[ціна TBD]"
  description: string;
  recommended?: boolean;
}

export interface Specialist {
  slug: string;
  fullName: string;
  title: string;
  subtitle?: string;
  photoUrl: string;
  photoAlt: string;
  heroQuote: string; // без зовнішніх лапок

  bioParagraphs: readonly string[];
  methodologyConnection: string;

  specializations: readonly string[];
  worksWith: readonly string[];
  education: string;
  certifications: string;
  languages: readonly string[];

  sessionTypes: readonly SessionOffering[];
  contactMethods: readonly ContactMethod[];

  telegramUsername?: string;
  telegramDisclaimer?: string;
  email?: string;
  emailDisclaimer?: string;

  status: SpecialistStatus;
  featured: boolean;
}

export const SPECIALISTS: readonly Specialist[] = [
  {
    slug: 'olena-vovk',
    fullName: 'Олена Вовк',
    title: 'Психотерапевт, член УСП',
    subtitle: 'Methodology Lead «Я Є»',
    photoUrl: '/specialists/olena-vovk.png',
    photoAlt: 'Олена Вовк — психотерапевт, Methodology Lead Я Є',
    heroQuote: 'між "треба триматися" і "я більше не можу"',

    bioParagraphs: [
      'Маю фах медичного психолога й психотерапевта та клінічний досвід, який навчив мене бачити людину цілісно — її тіло, її внутрішній світ і те, що між ними часто губиться. Наразі підвищую кваліфікацію у Віденській школі екзистенційного аналізу (GLE-International).',
      'Я працюю не для того, щоб просто «прибрати симптом», а щоб допомогти дорослим і дітям нарешті почути себе: свої потреби, втому, біль, надію. Мої знання в екзистенційному аналізі, КПТ, арт-терапії та МАК дозволяють обирати не шаблони, а те, що справді підходить конкретній людині.',
      'Я підтримую тих, хто застряг між «треба триматися» і «я більше не можу», тих, хто шукає опору в хиткому світі, і дітей, які ще не вміють говорити про складне словами, але говорять поведінкою та тілом.',
    ],

    methodologyConnection:
      'Я співавтор методологічної рамки продукту «Я Є». AI, з яким ти говорив(ла) у чаті, побудований на принципах екзистенційного аналізу, які я допомагала формувати з самого початку.',

    specializations: ['екзистенційний аналіз', 'КПТ', 'арт-терапія', 'МАК'],
    worksWith: ['підлітки', 'молоді дорослі', 'діти'],
    education: 'Медичний психолог, психотерапевт',
    certifications: 'GLE-International (Відень) — підвищення кваліфікації',
    languages: ['українська'],

    sessionTypes: [
      {
        type: 'discovery',
        title: 'Discovery call',
        durationMin: 15,
        durationLabel: '15 хв',
        priceText: 'безкоштовно',
        description:
          'Знайомство і перевірка, чи комфортно зі мною як фахівцем. Без коммітменту на подальшу роботу.',
      },
      {
        type: 'thematic',
        title: 'Тематична сесія',
        durationMin: 20,
        durationLabel: '20 хв',
        priceText: '[ціна TBD]',
        description:
          'Поговоримо про конкретний епізод з твоєї розмови з AI. Ти можеш поділитись фрагментом — це seed для нашої зустрічі.',
        recommended: true,
      },
      {
        type: 'full',
        title: 'Повноцінна сесія',
        durationMin: 50,
        durationLabel: '50 хв',
        priceText: '[ціна TBD]',
        description:
          'Класичний формат psychotherapy-сесії. Підходить, якщо вже працювали разом або готовий(а) до більшої глибини.',
      },
    ],

    contactMethods: ['telegram', 'email', 'form'],
    telegramUsername: 'lorvovk',
    telegramDisclaimer: 'відповідаю 10-19, пн-пт',
    email: 'likar.olenavovk@gmail.com',
    emailDisclaimer:
      'це тестовий контакт для Demo-стадії — у production замінимо на брендований email',

    status: 'active',
    featured: true,
  },
];

export function getSpecialistBySlug(slug: string): Specialist | undefined {
  return SPECIALISTS.find((s) => s.slug === slug && s.status === 'active');
}

export function getSessionType(specialist: Specialist, type: string): SessionOffering | undefined {
  return specialist.sessionTypes.find((s) => s.type === type);
}
