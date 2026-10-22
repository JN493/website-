-- Two optional quote fields: "Need by" (free text, e.g. "ASAP") and "Location (town or area)".
-- Run in the Supabase SQL Editor BEFORE redeploying submit-form (the function inserts these columns).
-- Safe to run more than once. Nullable text, 100 characters max. Not added to contacts.
-- Adding columns does not change row level security, policies or grants on quote_requests.

begin;

alter table public.quote_requests
  add column if not exists need_by text,
  add column if not exists location text;

alter table public.quote_requests drop constraint if exists quote_requests_need_by_length;
alter table public.quote_requests add constraint quote_requests_need_by_length check (char_length(need_by) <= 100);

alter table public.quote_requests drop constraint if exists quote_requests_location_length;
alter table public.quote_requests add constraint quote_requests_location_length check (char_length(location) <= 100);

commit;

-- Checks (read only). Run each on its own.

-- Good result: two rows, need_by and location, both text and nullable (is_nullable = YES).
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'quote_requests' and column_name in ('need_by', 'location');

-- Good result: two rows, quote_requests_need_by_length and quote_requests_location_length.
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.quote_requests'::regclass and conname like 'quote_requests_%_length';

-- Good result: one row with relrowsecurity = true (row level security still on).
select relname, relrowsecurity from pg_class where oid = 'public.quote_requests'::regclass;

-- Good result (after lock-down-direct-inserts.sql has been run): no rows (anon/authenticated still cannot insert).
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'quote_requests'
  and grantee in ('anon', 'authenticated') and privilege_type = 'INSERT';
