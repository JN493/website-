-- Run after supabase/lock-down-direct-inserts.sql. Run each query on its own.

-- Good result: no rows returned (no INSERT policies left for the website on the three tables or two buckets).
select schemaname, tablename, policyname, roles, with_check
from pg_policies
where cmd = 'INSERT'
  and roles && array['anon', 'authenticated', 'public']::name[]
  and (tablename in ('quote_requests', 'brochure_requests', 'job_applications')
       or (schemaname = 'storage' and tablename = 'objects'
           and (with_check like '%quote-files%' or with_check like '%cv-files%')));

-- Good result: no rows returned (anon and authenticated no longer have INSERT on the three tables).
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('quote_requests', 'brochure_requests', 'job_applications')
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'INSERT';

-- Good result: no rows returned (contacts has no policies at all; RLS with no policies blocks the website).
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'contacts';

-- Good result: no rows returned (anon and authenticated have no privileges of any kind on contacts).
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'contacts'
  and grantee in ('anon', 'authenticated');

-- Good result: no rows returned (the website's roles cannot call upsert_contact).
select routine_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema = 'public'
  and routine_name = 'upsert_contact'
  and grantee in ('anon', 'authenticated', 'PUBLIC');

-- Good result: one row, with relrowsecurity = true (row level security is on for contacts).
select relname, relrowsecurity from pg_class where oid = 'public.contacts'::regclass;

-- Good result: no rows returned (retention_log has no policies, so the website's roles cannot read or write it).
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'retention_log';

-- Good result: no rows returned (anon and authenticated have no privileges of any kind on retention_log).
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'retention_log'
  and grantee in ('anon', 'authenticated');

-- Good result: two rows (quote_requests, brochure_requests), each with confdeltype = 'a' (no action).
-- 'c' (cascade) or 'n' (set null) would mean deleting a contact could change or remove requests.
select conrelid::regclass as referencing_table, conname, confdeltype
from pg_constraint
where confrelid = 'public.contacts'::regclass and contype = 'f';
