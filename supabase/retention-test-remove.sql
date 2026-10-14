-- =====================================================================
-- Removes the FAKE test rows added by supabase/retention-test-seed.sql.
-- NOT run automatically. Run by hand in the SQL Editor after the dry run.
-- Only touches rows whose email starts with "retention-test-" and ends in "@example.invalid".
-- Requests are deleted before contacts (the foreign keys require that order). Safe to re-run.
-- =====================================================================

begin;

delete from public.quote_requests where email like 'retention-test-%@example.invalid';
delete from public.brochure_requests where email like 'retention-test-%@example.invalid';
delete from public.job_applications where email like 'retention-test-%@example.invalid';
delete from public.contacts where email like 'retention-test-%@example.invalid';

commit;

-- Check (run separately): each count should be 0.
-- select
--   (select count(*) from public.quote_requests where email like 'retention-test-%@example.invalid') as quotes,
--   (select count(*) from public.brochure_requests where email like 'retention-test-%@example.invalid') as brochures,
--   (select count(*) from public.job_applications where email like 'retention-test-%@example.invalid') as applications,
--   (select count(*) from public.contacts where email like 'retention-test-%@example.invalid') as contacts;
