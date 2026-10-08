-- =====================================================================
-- WARNING: RUN THIS ONLY AFTER the submit-form Edge Function is deployed,
-- TURNSTILE_SECRET_KEY is set, and all three forms (quote, brochure,
-- careers) have been tested successfully through it on the preview site.
-- If you run it before that, ALL THREE FORMS STOP WORKING.
-- =====================================================================
--
-- Removes the website's direct (anon key) access, so the Edge Function
-- (which uses the service role) is the only way to save form data.
-- Signed upload URLs from the function keep working after this.
-- Safe to re-run.

begin;

-- 1. Policies created by supabase/brochure-and-careers.sql (known names)
drop policy if exists "Website can submit brochure requests" on public.brochure_requests;
drop policy if exists "Website can submit job applications" on public.job_applications;
drop policy if exists "Website can upload CVs" on storage.objects;

-- 2. Any other INSERT policy that lets anon (or everyone) in, found by name at run time.
--    Covers the older quote_requests table and quote-files bucket policies.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where cmd = 'INSERT'
      and roles && array['anon', 'authenticated', 'public']::name[]
      and (
        (schemaname = 'public' and tablename in ('quote_requests', 'brochure_requests', 'job_applications'))
        or (schemaname = 'storage' and tablename = 'objects'
            and (coalesce(with_check, '') like '%quote-files%' or coalesce(with_check, '') like '%cv-files%'))
      )
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    raise notice 'Dropped policy "%" on %.%', p.policyname, p.schemaname, p.tablename;
  end loop;
end $$;

-- 3. Take away the INSERT permission itself
revoke insert on table public.quote_requests, public.brochure_requests, public.job_applications from anon, authenticated;

commit;

-- ---------------------------------------------------------------------
-- Check the result (run separately). Both queries should return NO rows.
-- ---------------------------------------------------------------------
-- Remaining insert policies for the website on the three tables or two buckets:
--
-- select schemaname, tablename, policyname, roles, with_check
-- from pg_policies
-- where cmd = 'INSERT'
--   and roles && array['anon', 'authenticated', 'public']::name[]
--   and (tablename in ('quote_requests', 'brochure_requests', 'job_applications')
--        or (schemaname = 'storage' and tablename = 'objects'
--            and (with_check like '%quote-files%' or with_check like '%cv-files%')));
--
-- Remaining INSERT grants for anon/authenticated on the three tables:
--
-- select table_name, grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name in ('quote_requests', 'brochure_requests', 'job_applications')
--   and grantee in ('anon', 'authenticated')
--   and privilege_type = 'INSERT';
