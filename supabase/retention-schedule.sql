-- =====================================================================
-- Daily schedule for the retention-cleanup Edge Function.
-- NOT run automatically. Run it by hand in the Supabase SQL Editor, ONLY after:
--   1. supabase/retention.sql has been run,
--   2. the retention-cleanup function is deployed with its secrets set,
--   3. a manual dry run has been checked in retention_log.
-- Before running: enable the pg_cron and pg_net extensions in the dashboard
-- (Database > Extensions, search "pg_cron" and "pg_net", enable both).
-- =====================================================================
--
-- Step A: store the two values the schedule needs in Vault (run once).
-- Replace the second placeholder in the editor with the SAME value you set as the
-- RETENTION_CLEANUP_SECRET function secret. Never save the real secret in this file or the repo.
--
-- select vault.create_secret('https://mvivwqyrtarryoomezgp.supabase.co', 'project_url');
-- select vault.create_secret('PASTE-THE-RETENTION_CLEANUP_SECRET-VALUE-HERE', 'retention_cleanup_secret');
--
-- Step B: create the schedule. 03:30 every day (pg_cron runs in UTC, so 03:30 GMT / 04:30 BST).
-- timeout_milliseconds: pg_net's default is only 2 seconds; a run can take longer.

select cron.schedule(
  'retention-cleanup-daily',
  '30 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/retention-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-retention-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'retention_cleanup_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);

-- ---------------------------------------------------------------------
-- Useful afterwards (run separately):
--
-- See the job:              select * from cron.job where jobname = 'retention-cleanup-daily';
-- Recent runs of the job:   select * from cron.job_run_details
--                           where jobid = (select jobid from cron.job where jobname = 'retention-cleanup-daily')
--                           order by start_time desc limit 10;
-- HTTP responses (kept ~6h): select id, status_code, content from net._http_response order by created desc limit 5;
-- What the function did:    select run_at, dry_run, killed, counts from public.retention_log order by run_at desc limit 10;
-- Stop the schedule:        select cron.unschedule('retention-cleanup-daily');
-- ---------------------------------------------------------------------
