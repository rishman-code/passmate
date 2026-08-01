-- PassMate Supabase schema

create table if not exists questions (
  id text primary key,
  category text not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('a', 'b', 'c', 'd')),
  explanation text not null,
  image_url text
);

create table if not exists user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references questions(id),
  answered_correctly boolean not null,
  answered_at timestamptz not null default now(),
  attempt_count integer not null default 1,
  primary key (user_id, question_id)
);

create table if not exists ai_explanation_cache (
  question_id text primary key references questions(id) on delete cascade,
  ai_explanation text not null,
  created_at timestamptz not null default now()
);

create table if not exists mock_test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  passed boolean not null,
  completed_at timestamptz not null default now(),
  time_taken_seconds integer not null
);

create index if not exists idx_questions_category on questions(category);
