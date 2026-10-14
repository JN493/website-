-- =====================================================================
-- FAKE TEST DATA for a safe dry run of retention-cleanup on the REAL project.
-- NOT run automatically. Run by hand in the SQL Editor, then trigger the function in DRY RUN mode
-- (RETENTION_DELETE_ENABLED not set to "true"), read retention_log, then run
-- supabase/retention-test-remove.sql to delete everything this file added.
--
-- Every row is obviously fake: emails end in @example.invalid and start with "retention-test-",
-- names are "RETENTION TEST - safe to delete". File paths point at files that do not exist.
-- =====================================================================
--
-- Expected extra counts in the dry run (on top of any real data that is genuinely old):
--   quote_requests     would_delete +2  (old contact's quote; no-contact old quote)
--   brochure_requests  would_delete +2  (sent 13 months ago; never sent, created 13 months ago)
--   job_applications   would_delete +1  (submitted 13 months ago)
--   contacts           would_delete +2  (old contact whose only quote would go; old contact with no rows)
-- Kept (not counted): recent quote, recent brochure, recent application, and the old contact still linked to a recent brochure.

begin;

with c as (
  insert into public.contacts (email, name, phone, company, first_seen_at, last_seen_at) values
    ('retention-test-old-quote@example.invalid', 'RETENTION TEST - safe to delete', '00000000000', '', now() - interval '14 months', now() - interval '13 months'),
    ('retention-test-orphan@example.invalid', 'RETENTION TEST - safe to delete', null, null, now() - interval '14 months', now() - interval '13 months'),
    ('retention-test-still-linked@example.invalid', 'RETENTION TEST - safe to delete', null, null, now() - interval '14 months', now() - interval '13 months')
  returning id, email
)
insert into public.quote_requests (name, company, phone, email, project_details, submission_description, file_paths, consent_given_at, created_at, contact_id)
select 'RETENTION TEST - safe to delete', '', '00000000000', c.email, 'RETENTION TEST', '', array['retention-test/does-not-exist.pdf'],
       now() - interval '13 months', now() - interval '13 months', c.id
from c where c.email = 'retention-test-old-quote@example.invalid';

insert into public.quote_requests (name, company, phone, email, project_details, submission_description, file_paths, consent_given_at, created_at, contact_id) values
  ('RETENTION TEST - safe to delete', '', '00000000000', 'retention-test-nocontact-old@example.invalid', 'RETENTION TEST', '', '{}', now() - interval '13 months', now() - interval '13 months', null),
  ('RETENTION TEST - safe to delete', '', '00000000000', 'retention-test-nocontact-new@example.invalid', 'RETENTION TEST', '', '{}', now() - interval '1 month', now() - interval '1 month', null);

insert into public.brochure_requests (email, consent_given_at, created_at, sent_at, contact_id)
select 'retention-test-still-linked@example.invalid', now() - interval '14 months', now() - interval '14 months', now() - interval '1 month', id
from public.contacts where email = 'retention-test-still-linked@example.invalid';

insert into public.brochure_requests (email, consent_given_at, created_at, sent_at, contact_id) values
  ('retention-test-sent-old@example.invalid', now() - interval '14 months', now() - interval '14 months', now() - interval '13 months', null),
  ('retention-test-unsent-old@example.invalid', now() - interval '13 months', now() - interval '13 months', null, null),
  ('retention-test-unsent-new@example.invalid', now() - interval '1 month', now() - interval '1 month', null, null);

insert into public.job_applications (name, email, file_path, consent_given_at, created_at) values
  ('RETENTION TEST - safe to delete', 'retention-test-applicant-old@example.invalid', 'retention-test/does-not-exist-cv.pdf', now() - interval '13 months', now() - interval '13 months'),
  ('RETENTION TEST - safe to delete', 'retention-test-applicant-new@example.invalid', 'retention-test/does-not-exist-cv.pdf', now() - interval '1 month', now() - interval '1 month');

commit;
