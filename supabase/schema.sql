create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text not null,
  genre text not null,
  status text not null default 'Dikemas kini setiap hari',
  update_time text not null,
  cover_tone text not null,
  synopsis text not null,
  hook text not null,
  audience text not null,
  tags text[] not null default '{}',
  readers_label text not null default '0 pembaca mingguan',
  updates_label text not null default '0 bab tersedia',
  saved_label text not null default '0 simpanan',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  excerpt text not null,
  content jsonb not null default '[]'::jsonb,
  published_at_label text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (book_id, chapter_number)
);

create table if not exists public.release_schedules (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  cadence text not null default 'daily',
  release_hour smallint not null default 19,
  release_minute smallint not null default 0,
  timezone text not null default 'Asia/Kuala_Lumpur',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  status text not null default 'completed',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.book_bibles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  genre text not null,
  premise text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chapter_outlines (
  id uuid primary key default gen_random_uuid(),
  book_bible_id uuid references public.book_bibles(id) on delete cascade,
  book_title text not null,
  chapter_number integer not null,
  title text not null,
  focus text not null,
  cliffhanger text not null,
  beats jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chapter_drafts (
  id uuid primary key default gen_random_uuid(),
  book_bible_id uuid references public.book_bibles(id) on delete cascade,
  chapter_outline_id uuid references public.chapter_outlines(id) on delete set null,
  book_title text not null,
  chapter_number integer not null,
  title text not null,
  excerpt text not null,
  content jsonb not null default '[]'::jsonb,
  word_count integer not null default 0,
  seo_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.books
add column if not exists cover_image_url text,
add column if not exists cover_thumbnail_url text;

create table if not exists public.cover_assets (
  id uuid primary key default gen_random_uuid(),
  book_bible_id uuid references public.book_bibles(id) on delete cascade,
  book_title text not null,
  prompt text not null,
  image_url text,
  thumbnail_url text,
  title_overlay_url text,
  status text not null default 'draft',
  selected boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.books enable row level security;
alter table public.chapters enable row level security;
alter table public.release_schedules enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.book_bibles enable row level security;
alter table public.chapter_outlines enable row level security;
alter table public.chapter_drafts enable row level security;
alter table public.cover_assets enable row level security;

drop policy if exists "Public can read published books" on public.books;
create policy "Public can read published books"
on public.books for select
using (is_published = true);

drop policy if exists "Public can read published chapters" on public.chapters;
create policy "Public can read published chapters"
on public.chapters for select
using (is_published = true);

drop policy if exists "Public can read release schedules" on public.release_schedules;
create policy "Public can read release schedules"
on public.release_schedules for select
using (true);

drop policy if exists "No public access to generation jobs" on public.generation_jobs;
create policy "No public access to generation jobs"
on public.generation_jobs for select
using (false);

drop policy if exists "No public access to book bibles" on public.book_bibles;
create policy "No public access to book bibles"
on public.book_bibles for select
using (false);

drop policy if exists "No public access to chapter outlines" on public.chapter_outlines;
create policy "No public access to chapter outlines"
on public.chapter_outlines for select
using (false);

drop policy if exists "No public access to chapter drafts" on public.chapter_drafts;
create policy "No public access to chapter drafts"
on public.chapter_drafts for select
using (false);

drop policy if exists "No public access to cover assets" on public.cover_assets;
create policy "No public access to cover assets"
on public.cover_assets for select
using (false);
