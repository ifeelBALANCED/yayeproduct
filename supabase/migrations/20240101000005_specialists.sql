-- ============================================================
-- Phase F · Specialist Directory
-- Зміст таблиці дзеркалить apps/teen/src/lib/specialists.ts
-- При Chunk B можна switch код на DB-fetch — структура збігається.
-- ============================================================

-- 5.1 SPECIALISTS — directory верифікованих фахівців
create table if not exists specialists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  title text not null,
  subtitle text,
  photo_url text,
  photo_alt text,
  hero_quote text,
  bio_paragraphs text[],
  methodology_connection text,

  specializations text[] default '{}',
  works_with text[] default '{}',
  education text,
  certifications text,
  languages text[] default '{}',

  -- Session offerings — три опційні типи
  offers_discovery boolean default true,
  discovery_duration_min integer default 15,
  discovery_price_text text default 'безкоштовно',

  offers_thematic boolean default false,
  thematic_duration_min integer default 20,
  thematic_price_text text,

  offers_full boolean default false,
  full_duration_min integer default 50,
  full_price_text text,

  -- Канали контакту (primary → secondary → tertiary)
  telegram_username text,
  telegram_disclaimer text,
  email text,
  email_disclaimer text,

  -- Placeholder для майбутньої інтеграції (Phase G)
  cal_com_url text,
  whereby_room_url text,

  status text default 'active' check (status in ('active', 'paused', 'archived')),
  featured boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5.2 BOOKING_REQUESTS — заявки на сесію (mock-flow, без Cal.com)
create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid references specialists(id) on delete restrict,
  session_type text check (session_type in ('discovery', 'thematic', 'full')),

  user_name text not null,
  contact_preferred text check (contact_preferred in ('telegram', 'email')),
  contact_value text not null,
  user_age_band text check (user_age_band in ('13-15', '16-17', '18-25', '25+')),

  topic text,
  ai_excerpt text,

  preferred_date date,
  preferred_time time,

  consent_offer boolean not null,
  consent_contact boolean not null,

  status text default 'new' check (status in ('new', 'contacted', 'scheduled', 'completed', 'cancelled')),
  contact_attempted_at timestamptz,
  scheduled_for timestamptz,

  created_at timestamptz default now()
);

-- RLS
alter table specialists enable row level security;
alter table booking_requests enable row level security;

create policy "specialists: public read of active"
  on specialists for select
  using (status = 'active');

create policy "specialists: service_role full access"
  on specialists for all
  using (auth.role() = 'service_role');

create policy "booking_requests: anyone can insert"
  on booking_requests for insert
  with check (true);

create policy "booking_requests: service_role read"
  on booking_requests for select
  using (auth.role() = 'service_role');

-- 5.3 SEED — профіль Олени дослівно з її біо (узгоджено з нею)
-- Шлях фото — .png (фактичний файл у public/), а НЕ .jpg як у спеці v1.1.
insert into specialists (
  slug, full_name, title, subtitle, photo_url, photo_alt, hero_quote,
  bio_paragraphs, methodology_connection,
  specializations, works_with, education, certifications, languages,
  offers_discovery, offers_thematic, offers_full,
  discovery_price_text, thematic_price_text, full_price_text,
  telegram_username, telegram_disclaimer,
  email, email_disclaimer,
  status, featured
) values (
  'olena-vovk',
  'Олена Вовк',
  'Психотерапевт, член УСП',
  'Methodology Lead «Я Є»',
  '/specialists/olena-vovk.png',
  'Олена Вовк — психотерапевт, Methodology Lead Я Є',
  'між "треба триматися" і "я більше не можу"',
  array[
    'Маю фах медичного психолога й психотерапевта та клінічний досвід, який навчив мене бачити людину цілісно — її тіло, її внутрішній світ і те, що між ними часто губиться. Наразі підвищую кваліфікацію у Віденській школі екзистенційного аналізу (GLE-International).',
    'Я працюю не для того, щоб просто «прибрати симптом», а щоб допомогти дорослим і дітям нарешті почути себе: свої потреби, втому, біль, надію. Мої знання в екзистенційному аналізі, КПТ, арт-терапії та МАК дозволяють обирати не шаблони, а те, що справді підходить конкретній людині.',
    'Я підтримую тих, хто застряг між «треба триматися» і «я більше не можу», тих, хто шукає опору в хиткому світі, і дітей, які ще не вміють говорити про складне словами, але говорять поведінкою та тілом.'
  ],
  'Я співавтор методологічної рамки продукту «Я Є». AI, з яким ти говорив(ла) у чаті, побудований на принципах екзистенційного аналізу, які я допомагала формувати з самого початку.',
  array['екзистенційний аналіз', 'КПТ', 'арт-терапія', 'МАК'],
  array['підлітки', 'молоді дорослі', 'діти'],
  'Медичний психолог, психотерапевт',
  'GLE-International (Відень) — підвищення кваліфікації',
  array['українська'],
  true, true, true,
  'безкоштовно',
  '[ціна TBD]',
  '[ціна TBD]',
  'lorvovk',
  'відповідаю 10-19, пн-пт',
  'likar.olenavovk@gmail.com',
  'це тестовий контакт для Demo-стадії — у production замінимо на брендований email',
  'active', true
)
on conflict (slug) do nothing;
