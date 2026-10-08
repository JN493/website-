-- Run this BEFORE supabase/lock-down-direct-inserts.sql and keep the result
-- (export or copy it somewhere safe), so the current policies can be restored if needed.
select schemaname, tablename, policyname, cmd, roles, qual, with_check from pg_policies where tablename in ('quote_requests','brochure_requests','job_applications') or (schemaname = 'storage' and tablename = 'objects');
