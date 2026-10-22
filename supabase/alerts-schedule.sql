-- =====================================================================
-- Every-15-minutes schedule for the alert-sweep Edge Function.
-- NOT run automatically. Run it by hand in the Supabase SQL Editor, ONLY after:
--   1. supabase/alerts.sql has been run,
--   2. submit-form and alert-sweep are deployed (alert-sweep with Verify JWT OFF) with their secrets set,
--   3. Microsoft is ready and ALERTS_ENABLED has been set to true.
-- pg_cron and pg_net are already enabled if supabase/retention-schedule.sql has been run;
-- otherwise enable both in the dashboard (Database > Extensions).
-- =====================================================================
--
-- Step A: store the sweep secret in Vault (run once).
-- Replace the placeholder in the editor with the SAME value you set as the ALERT_SWEEP_SECRET
-- function secret. Never save the real secret in this file or the repo.
-- 'project_url' is already in Vault if the retention schedule was set up (do not create it twice;
-- check with: select name from vault.secrets;). Only if it is missing, also run the first line.
--
-- select vault.create_secret('https://mvivwqyrtarryoomezgp.supabase.co', 'project_url');
-- select vault.create_secret('PASTE-THE-ALERT_SWEEP_SECRET-VALUE-HERE', 'alert_sweep_secret');
--
-- Step B: create the schedule. Every 15 minutes.
-- timeout_milliseconds: pg_net's default is only 2 seconds; a run can take longer (the function
-- stops starting new emails after about 100 seconds).

select cron.schedule(
  'alert-sweep-15min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/alert-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-alert-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'alert_sweep_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);

-- ---------------------------------------------------------------------
-- Useful afterwards (run separately):
--
-- See the job:              select * from cron.job where jobname = 'alert-sweep-15min';
-- Recent runs of the job:   select * from cron.job_run_details
--                           where jobid = (select jobid from cron.job where jobname = 'alert-sweep-15min')
--                           order by start_time desc limit 10;
-- HTTP responses (kept ~6h): select id, status_code, content from net._http_response order by created desc limit 5;
-- Waiting alerts:           select 'quote' as kind, id, created_at, notify_attempts from public.quote_requests where notified_at is null
--                           union all
--                           select 'application', id, created_at, notify_attempts from public.job_applications where notified_at is null
--                           order by created_at desc;
-- Given up (5 attempts):    same query with "and notify_attempts >= 5"
-- Stop the schedule:        select cron.unschedule('alert-sweep-15min');
-- ---------------------------------------------------------------------
