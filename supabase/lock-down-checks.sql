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
