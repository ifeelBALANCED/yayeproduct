-- exercise_feedback: anonymous feedback after grounding exercise on landing.
-- No user_id — analytics only. Anon inserts allowed via RLS.
create table if not exists exercise_feedback (
  id         uuid default gen_random_uuid() primary key,
  result     text not null check (result in ('helped', 'neutral')),
  created_at timestamptz default now()
);

alter table exercise_feedback enable row level security;

-- anyone can insert, no one can read/update/delete via API
create policy "anon can insert exercise_feedback"
  on exercise_feedback for insert
  to anon
  with check (true);
