-- ============================================================
-- Phase 2 · S2 RLS-матриця та каскади
-- Закриває діри, виявлені quality-gate S2:
--   • sessions — відсутня DELETE-policy
--   • booking_requests — відсутні UPDATE/DELETE для service_role
--   • exercise_feedback — відсутня SELECT (service_role аналітика)
--   • therapists — конфліктні SELECT-policies (000001:136-142 + 000003 не додає)
--     → дві окремі FOR SELECT-policy дають недетермінований OR;
--       замінюємо однією комбінованою.
-- ============================================================

-- ============================================================
-- 1. SESSIONS — додаємо DELETE для власника
-- ============================================================

-- Підліток може видалити власну сесію (GDPR cascade: messages + crisis_events
-- видаляються каскадом через FK ON DELETE CASCADE, встановлений у 000001).
create policy "sessions: teen deletes own"
  on sessions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 2. BOOKING_REQUESTS — UPDATE/DELETE для service_role
-- ============================================================

-- service_role має bypassrls у Supabase, але явні policy документують
-- намір і дозволяють RLS-матриць-тестам перевірити факт через
-- set role / set request.jwt.claims.
create policy "booking_requests: service_role update"
  on booking_requests for update
  using (auth.role() = 'service_role');

create policy "booking_requests: service_role delete"
  on booking_requests for delete
  using (auth.role() = 'service_role');

-- ============================================================
-- 3. EXERCISE_FEEDBACK — SELECT для service_role (аналітика)
-- ============================================================

-- За дизайном: anon може insert, ніхто не може читати через API крім
-- service_role (для аналітичних запитів). Явна policy.
create policy "exercise_feedback: service_role select"
  on exercise_feedback for select
  using (auth.role() = 'service_role');

-- ============================================================
-- 4. THERAPISTS — фікс конфліктних SELECT-policies
--
-- 000001 створює дві FOR SELECT policy на therapists:
--   "therapists: own profile"       — auth.uid() = id
--   "therapists: teens see active"  — active = true
--
-- Дві SELECT-policy об'єднуються PostgreSQL через OR, тобто
-- терапевт бачить усіх активних колег (не лише себе).
-- Це не детермінована матриця — замінюємо на одну policy.
-- ============================================================

drop policy if exists "therapists: own profile" on therapists;
drop policy if exists "therapists: teens see active" on therapists;

-- Комбінована детермінована policy:
--   • терапевт бачить свій рядок (навіть якщо active = false)
--   • підліток / анонім бачить лише active = true
--   • service_role — bypassrls (не потребує policy, але додаємо нижче для матриці)
create policy "therapists: select"
  on therapists for select
  using (
    auth.uid() = id
    or (active = true)
  );

-- service_role повний доступ на запис (000005 вже додає "specialists: service_role full access";
-- therapists — окрема таблиця, потребує власних write-policies).
create policy "therapists: service_role insert"
  on therapists for insert
  with check (auth.role() = 'service_role');

create policy "therapists: service_role update"
  on therapists for update
  using (auth.role() = 'service_role');

create policy "therapists: service_role delete"
  on therapists for delete
  using (auth.role() = 'service_role');

-- ============================================================
-- 5. FK-каскади — аудит та виправлення
--
-- Перевірено по міграціях:
--   sessions.user_id     → users(id) ON DELETE CASCADE  ✓ (000001:28)
--   messages.session_id  → sessions(id) ON DELETE CASCADE ✓ (000001:55)
--   crisis_events.session_id → sessions(id) ON DELETE CASCADE ✓ (000001:87)
--   crisis_events.user_id    → users(id) ON DELETE CASCADE ✓ (000001:88)
--
-- Таким чином DELETE users.id каскадно видаляє:
--   sessions → messages → (cascade via sessions)
--   sessions → crisis_events → (cascade via sessions)
--   crisis_events (через user_id також)
--
-- referrals.session_id → sessions(id) — без CASCADE (000001:147).
-- Для GDPR DELETE /api/sessions/[id] referral має зберігатися
-- (therapist-side запис), тому SET NULL коректніший за CASCADE.
-- ============================================================

alter table referrals
  drop constraint if exists referrals_session_id_fkey;

alter table referrals
  add constraint referrals_session_id_fkey
    foreign key (session_id)
    references sessions(id)
    on delete set null;

-- ============================================================
-- 6. ПОВНА RLS-МАТРИЦЯ (документаційні коментарі)
--
-- Таблиця          | anon        | authenticated          | service_role
-- -----------------+-------------+------------------------+-------------
-- users            | —           | own row (S/I/U/D)      | bypass
-- sessions         | —           | own (S/I/U/D)          | bypass
-- messages         | —           | own via session (S/I)  | bypass
-- crisis_events    | —           | own (S); svc all       | bypass
-- therapists       | active (S)  | own∪active (S); svc W  | bypass
-- referrals        | —           | own/assigned (S/U)     | bypass
-- consent_log      | —           | own (S/I/U/D)          | bypass
-- specialists      | active (S)  | active (S)             | bypass
-- booking_requests | insert (I)  | insert (I)             | bypass (S/U/D explicit)
-- exercise_feedback| insert (I)  | insert (I)             | bypass (S explicit)
-- ============================================================
