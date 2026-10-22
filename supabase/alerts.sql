-- Email alerts for quote requests and job applications: tracking columns.
-- Run in the Supabase SQL Editor BEFORE deploying the alert versions of submit-form and alert-sweep.
--
-- notified_at      when the alert email was sent (null = not sent yet)
-- notify_attempts  how many times sending has been tried (the sweep stops at 5)
--
-- Every row that exists when the column is first added is marked as already notified,
-- so old data never triggers an alert. Safe to run twice: the backfill only happens in the
-- run that adds notified_at, so a second run cannot hide alerts for newer rows.
-- Adding columns does not change row level security, policies or grants.

begin;

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'notified_at') then
    alter table public.quote_requests add column notified_at timestamptz;
    update public.quote_requests set notified_at = now();
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'job_applications' and column_name = 'notified_at') then
    alter table public.job_applications add column notified_at timestamptz;
    update public.job_applications set notified_at = now();
  end if;
end $$;

alter table public.quote_requests add column if not exists notify_attempts int not null default 0;
alter table public.job_applications add column if not exists notify_attempts int not null default 0;

commit;

-- Checks (read only). Run each on its own.

-- Good result: four rows (notified_at timestamptz nullable, notify_attempts integer not null default 0, on both tables).
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('quote_requests', 'job_applications')
  and column_name in ('notified_at', 'notify_attempts')
order by table_name, column_name;

-- Good result straight after the first run: both counts 0 (every existing row is marked as notified).
select
  (select count(*) from public.quote_requests where notified_at is null) as quotes_waiting,
  (select count(*) from public.job_applications where notified_at is null) as applications_waiting;

-- Good result: two rows, both with relrowsecurity = true (row level security still on).
select relname, relrowsecurity from pg_class
where oid in ('public.quote_requests'::regclass, 'public.job_applications'::regclass);

-- Good result (after lock-down-direct-inserts.sql has been run): no rows (anon/authenticated still cannot insert).
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('quote_requests', 'job_applications')
  and grantee in ('anon', 'authenticated') and privilege_type = 'INSERT';
