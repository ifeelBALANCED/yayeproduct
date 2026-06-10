-- Dev seed: 3 тестові терапевти + auth.users синхронізація
-- НЕ використовувати у production
--
-- auth.users записи необхідні для локального тестування RLS-матриці:
-- policy "therapists: select" перевіряє auth.uid() = id,
-- що нетестовно без відповідного запису в auth.users.
-- Паролі: bcrypt('password', gen_salt('bf')) — лише для локального dev.
--
-- Боргова мітка quality-gate §6:
-- "Особисті контакти реальної людини в коді й seed" (migrations/000005:137-140)
-- Новий seed використовує виключно placeholder-дані @example.com.

-- GoTrue-вимоги для password-логіну (перевірено проти supabase CLI 1.207.9):
--   instance_id          — '00000000-…' (NULL → користувача не видно GoTrue)
--   raw_app_meta_data    — provider email (NULL → логін відхиляється)
--   token-поля           — '' замість NULL (Go sql.Scan падає на NULL text)
--   auth.identities      — обов'язковий рядок provider='email' (нижче)
insert into auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  v.id::uuid,
  v.email,
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"therapist"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '', '', '', '', '', '', '', ''
from (values
  ('11111111-0000-0000-0000-000000000001', 'therapist1@example.com'),
  ('11111111-0000-0000-0000-000000000002', 'therapist2@example.com'),
  ('11111111-0000-0000-0000-000000000003', 'therapist3@example.com')
) as v(id, email)
on conflict (id) do nothing;

-- Без identity signInWithPassword → "Invalid login credentials"
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email in ('therapist1@example.com', 'therapist2@example.com', 'therapist3@example.com')
on conflict (provider_id, provider) do nothing;

-- 3 тестові верифіковані терапевти
insert into therapists (
  id,
  email,
  full_name,
  license_authority,
  license_number,
  license_verified_at,
  jurisdictions,
  languages,
  modalities,
  city,
  country,
  free_first_session,
  active
) values
(
  '11111111-0000-0000-0000-000000000001',
  'therapist1@test.ya-ye.app',
  'Марія Коваленко',
  'USP',
  'USP-TEST-001',
  now(),
  array['UA'],
  array['uk'],
  array['EA','CBT'],
  'Київ',
  'UA',
  true,
  true
),
(
  '11111111-0000-0000-0000-000000000002',
  'therapist2@test.ya-ye.app',
  'Олексій Мельник',
  'USP',
  'USP-TEST-002',
  now(),
  array['UA','EU'],
  array['uk','en'],
  array['EA','ACT'],
  'Львів',
  'UA',
  true,
  true
),
(
  '11111111-0000-0000-0000-000000000003',
  'therapist3@test.ya-ye.app',
  'Sophia Weber',
  'BACP',
  'BACP-TEST-003',
  now(),
  array['EU','UK'],
  array['en','de'],
  array['EA','TFP'],
  'Berlin',
  'DE',
  true,
  true
);
