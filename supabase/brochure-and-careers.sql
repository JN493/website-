-- Brochure requests and job applications.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- Mirrors quote_requests / quote-files: RLS on, the website (anon) can only INSERT,
-- and only with consent_given_at set. No public read, update or delete.

-- 1. Brochure requests (Projects page)
create table if not exists public.brochure_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  consent_given_at timestamptz not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.brochure_requests enable row level security;
grant insert on table public.brochure_requests to anon, authenticated;
drop policy if exists "Website can submit brochure requests" on public.brochure_requests;
create policy "Website can submit brochure requests"
  on public.brochure_requests for insert
  to anon, authenticated
  with check (consent_given_at is not null);

-- 2. Job applications (Careers page)
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  file_path text not null,
  consent_given_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.job_applications enable row level security;
grant insert on table public.job_applications to anon, authenticated;
drop policy if exists "Website can submit job applications" on public.job_applications;
create policy "Website can submit job applications"
  on public.job_applications for insert
  to anon, authenticated
  with check (consent_given_at is not null);

-- 3. Private bucket for CVs: 5 MB, PDF and Word only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-files', 'cv-files', false, 5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- 4. The website can upload CVs, but not view, list or delete them
drop policy if exists "Website can upload CVs" on storage.objects;
create policy "Website can upload CVs"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'cv-files');
