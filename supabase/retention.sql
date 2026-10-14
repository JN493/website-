-- Retention clean-up: log table, lock-down, and a foreign-key safety check.
-- Run once in the Supabase SQL Editor BEFORE deploying the retention-cleanup function. Safe to re-run.
--
-- retention_log holds one row per run: when it ran, whether it was a dry run, whether the kill switch
-- stopped it, and per-table counts (would_delete / deleted / failed / more_remaining).
-- It holds NO personal data: no names, emails, file names or record IDs.

begin;

create table if not exists public.retention_log (
  id bigint generated always as identity primary key,
  run_at timestamptz not null default now(),
  dry_run boolean not null,
  killed boolean not null default false,
  counts jsonb not null default '{}'::jsonb
);

-- Locked down like contacts: RLS on with no policies, no privileges for the website's roles.
-- Only the service role (used by the function) can write it; read it in the dashboard.
alter table public.retention_log enable row level security;
revoke all on table public.retention_log from anon, authenticated;

commit;

-- ---------------------------------------------------------------------
-- Foreign-key check (run separately, read the result).
-- confdeltype: a = NO ACTION, r = RESTRICT (both safe: a referenced contact cannot be deleted
-- and nothing cascades). c = CASCADE or n = SET NULL would be WRONG; tell the developer.
-- Expect two rows (quote_requests and brochure_requests), each with confdeltype = 'a'.
-- ---------------------------------------------------------------------
-- select conrelid::regclass as referencing_table, conname, confdeltype
-- from pg_constraint
-- where confrelid = 'public.contacts'::regclass and contype = 'f';
