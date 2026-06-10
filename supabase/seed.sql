-- Dev seed: 3 тестові терапевти + 1 clinical reviewer
-- НЕ використовувати у production

-- Clinical reviewer placeholder (замінити перед launch)
-- Створюється через Supabase Auth dashboard вручну з email reviewer@ya-ye.app
-- і роллю clinical_reviewer у user_metadata

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
