-- ============================================================
-- «Я Є» — Initial Schema
-- All tables have RLS enabled from the start.
-- ============================================================

-- 3.1 USERS (підлітки) — анонімні за дизайном
create table users (
  id uuid primary key default gen_random_uuid(),
  age_band text not null check (age_band in ('13-15','16-17','18-25')),
  locale text not null default 'uk',
  jurisdiction text not null default 'UA',
  parental_consent_status text check (parental_consent_status in ('pending','granted','na')),
  parental_consent_method text,
  created_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  deleted_at timestamptz
);

alter table users enable row level security;

create policy "users: own row only"
  on users for all
  using (auth.uid() = id);

-- 3.2 SESSIONS — 25-хвилинна сесія за дизайном
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  theme text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('time_up','user_closed','crisis_handoff','therapist_handoff')),
  modes_sequence int[],
  fm_dominant int check (fm_dominant between 1 and 4),
  graduation_completed boolean default false
);

alter table sessions enable row level security;

create policy "sessions: teens see own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "sessions: teens insert own"
  on sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions: teens update own"
  on sessions for update
  using (auth.uid() = user_id);

-- 3.3 MESSAGES
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  mode int check (mode between 1 and 4),
  fm_detected int check (fm_detected between 1 and 4),
  principle_applied text,
  created_at timestamptz default now(),
  flagged_for_review boolean default false
);

alter table messages enable row level security;

-- Тільки service_role може читати messages через API route
-- Підліток читає тільки свої повідомлення через session ownership
create policy "messages: teen reads own via session"
  on messages for select
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

create policy "messages: teen inserts via own session"
  on messages for insert
  with check (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

-- 3.4 CRISIS_EVENTS
create table crisis_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  trigger_message_id uuid references messages(id),
  severity text not null check (severity in ('elevated','high','imminent')),
  detection_method text,
  jurisdiction text not null,
  hotlines_shown text[],
  user_action text,
  clinical_review_at timestamptz,
  clinical_review_by uuid,
  clinical_notes text,
  created_at timestamptz default now()
);

alter table crisis_events enable row level security;

create policy "crisis_events: user sees own"
  on crisis_events for select
  using (auth.uid() = user_id);

create policy "crisis_events: service_role full access"
  on crisis_events for all
  using (auth.role() = 'service_role');

-- 3.5 THERAPISTS
create table therapists (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  license_authority text not null,
  license_number text not null,
  license_verified_at timestamptz,
  license_verified_by uuid,
  jurisdictions text[] not null,
  languages text[] not null,
  modalities text[],
  city text,
  country text,
  free_first_session boolean default true,
  active boolean default false,
  created_at timestamptz default now()
);

create unique index therapists_license_unique
  on therapists (license_authority, license_number);

alter table therapists enable row level security;

create policy "therapists: own profile"
  on therapists for select
  using (auth.uid() = id);

create policy "therapists: teens see active therapists"
  on therapists for select
  using (active = true);

-- 3.6 REFERRALS
create table referrals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  user_id uuid references users(id) on delete cascade,
  therapist_id uuid references therapists(id),
  status text not null default 'new' check (status in ('new','accepted','declined','completed','no_show')),
  urgency text not null default 'normal' check (urgency in ('normal','urgent')),
  theme text,
  age_band text,
  jurisdiction text,
  modes_sequence int[],
  summary text,
  summary_approved_by_teen boolean default false,
  summary_approved_at timestamptz,
  consent_log_id uuid,
  proposed_slots jsonb,
  accepted_slot timestamptz,
  created_at timestamptz default now()
);

alter table referrals enable row level security;

create policy "referrals: teen sees own"
  on referrals for select
  using (auth.uid() = user_id);

create policy "referrals: therapist sees assigned"
  on referrals for select
  using (auth.uid() = therapist_id);

create policy "referrals: therapist updates assigned"
  on referrals for update
  using (auth.uid() = therapist_id);

-- 3.7 CONSENT_LOG — GDPR Art. 7
create table consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  consent_type text not null check (consent_type in ('share_summary','share_profile','crisis_handoff')),
  scope text not null,
  granted boolean not null,
  granted_at timestamptz default now(),
  withdrawn_at timestamptz,
  evidence jsonb
);

alter table consent_log enable row level security;

create policy "consent_log: own records"
  on consent_log for all
  using (auth.uid() = user_id);
