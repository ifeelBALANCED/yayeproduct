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

insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) values
(
  '11111111-0000-0000-0000-000000000001',
  'therapist1@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"role":"therapist"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
),
(
  '11111111-0000-0000-0000-000000000002',
  'therapist2@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"role":"therapist"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
),
(
  '11111111-0000-0000-0000-000000000003',
  'therapist3@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"role":"therapist"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
)
on conflict (id) do nothing;

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
