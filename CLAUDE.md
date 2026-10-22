# SLS Fabrications Website: Project Context

Last updated: 2026-10-22. Keep this file current: after any task that changes the site, hosting, content decisions or status, update the relevant section in the same commit.

## About the business
SLS Fabrications is a welding and steel fabrication workshop based in Hailsham, East Sussex, UK.
- Address: Unit 2 Hythe Works, Diplocks Way, Hailsham, BN27 3JF, United Kingdom
- Phone: 01323 846061
- Hours: Mon to Fri, 7:30am to 5:00pm
- Small team (5 to 15 people)
- Legal entity: SLS Fabrications Limited, company number 03187824, registered office 30-34 North Street, Hailsham, East Sussex, BN27 1DW (as given in the approved Privacy Policy and Terms, 2026-10-08).
- People: Rob (owner), Rachael (business consultant), the developer (19, works on the site and later an internal workshop app)

## Project goal
Build the company website now, and later an internal workshop efficiency app (Supabase backend). Next.js (App Router) + Tailwind, static export.

## Project status (2026-10-22)
As recorded by the developer on 2026-10-22. This section is the source of truth; the older sections below were reconciled with it on 2026-10-22. If anything still disagrees, ask before acting.

Working rules for future sessions
- Do not push unless the developer asks.
- Commit in small stages.
- Report with evidence and say what could not be verified.
- No em dashes in site copy.
- Ask before adding details or copy the developer has not given.

Done
- Site: Next.js static export on Cloudflare Workers, preview at https://website.robstonesls77.workers.dev (behind Cloudflare Access), built from GitHub `main`. Not on the real domain yet.
- Forms (quote, brochure, careers) with Turnstile, honeypot, Supabase Edge Function `submit-form`, contacts table.
- Quote form has two optional fields, Location (town or area) and Need by (free text), stored in `quote_requests.location` and `quote_requests.need_by` (100 characters max each, null when empty).
- Form labels have no "(optional)" markers and no asterisks; required fields use the native `required` attribute.
- Security headers with an enforcing CSP covering Tag Manager, Google Analytics, Cookiebot, Turnstile and Supabase.
- Cookiebot (Domain Group ID fbd2a6ae-76e6-4170-bb8d-46ced9c918cf, preview added as an alias) loaded directly from `app/layout.tsx` after the Consent Mode defaults and Tag Manager.
- Tag Manager container GTM-M995FM9J is published:
  - The Google tag (G-24P1P65D2S) and the GA4 event tag both require `analytics_storage` consent.
  - The Google tag also fires on the custom event `cookie_consent_update` and is set to fire once per page.
  - Tested: no collect requests or `_ga` cookies before consent or after reject; `page_view`, `phone_click` and `email_click` are sent after accepting statistics.
- Full redesign:
  - Inter font, brand blue #004167, sticky header, blue footer with the white logo bottom right.
  - Hero carousel (team, welding, laser cutting) with dots and an integrated pause control.
  - Short blue accent lines under headings, subtle fade-up on scroll, tile hover effect on Capabilities and Industries.
- Accessibility baseline (axe zero violations, keyboard pass) at the last redesign commit. Re-run after any further design change.
- Retention deletion job:
  - Deployed in Supabase, runs daily at 03:30 UTC in DRY-RUN mode, logs in `retention_log`.
  - Real deletion is OFF (`RETENTION_DELETE_ENABLED` not set).
  - The optional real-deletion test with fake rows was skipped and is still recommended before launch.
  - First real data will not reach 12 months until about October 2027; review the log and enable real deletion before then.
  - The secret lives only in a password manager, Supabase function secrets and Vault, never in the repo.
- Structured data (LocalBusiness JSON-LD), sitemap and robots.

Decisions
- Cookiebot stays; CookieYes was rejected.
- Email stays on Microsoft 365; Google Workspace was dropped. An admin account is being set up properly. info@slsfabrications.com does not exist yet and must be working before launch.
- Hero images: the team and laser photos are Unsplash TEST images; the welding photo is SLS's own but low resolution.
- Copy is placeholder until the consultant writes it.
- Home tagline: "Sheet metal and welding specialists, bespoke service & designs from small to large scale projects." ("Steel shaped to spec" was removed.)
- The workshop app (a dashboard for tracking jobs and workflows) is planned for later. Google sign-in is no longer assumed because Workspace was dropped.

Open items before launch
- Privacy Policy and Cookie Policy rewrite. Draft the text for approval before editing the site. It is one combined change with a new "Last updated" date, covering:
  - Google Analytics and Tag Manager.
  - Cookiebot consent logging and its cookie.
  - Exact cookies and lifespans, taken from the vendors' documentation.
  - The 12-month retention rules.
  - The new quote fields.
  - The Microsoft email line.
  - The ICO registration number ZC269397 (verify it against the certificate and the ICO register).
  - The backups line.
  - The Cookie Policy line saying the site stores nothing in the browser, which is no longer true.
- Microsoft 365:
  - Admin access, create info@, verify the domain with a DNS record, enable DKIM.
  - Do not touch MX or SPF records until reviewed.
  - Do not delete the two Netlify CNAMEs until launch.
- Brochure emailing is not built. It needs the brochure PDF, approved wording, a sender address and DKIM.
- Launch steps:
  - Attach the domain to the Worker.
  - Set up www and .co.uk redirects, and HSTS.
  - Retire Netlify.
  - Submit the sitemap in Search Console and run the Rich Results test.
  - On the real domain, check the CSP and that there is no Access login.
- Supabase:
  - Check backup retention on our plan.
  - Sweep for orphaned quote-files uploads.
  - Run the real-deletion test.
- Replace the test hero images and get a full-size welding photo.
- Optionally add the logo to the JSON-LD.
- Test with a real screen reader (NVDA or VoiceOver) and a real phone.
- Check the Cookiebot privacy icon against the footer on the preview.
- Cookiebot only logs consent on the registered domain (the preview shows "Internal test version. Cookie Consent not logged"). Add slsfabrications.com to the Cookiebot domain group before launch and confirm consents appear in the consent log after launch.
- Check whether Next.js link-prefetch requests return 404 on the Worker (seen on a local static server).
- Industries tiles have no description, so the hover gradient only shows on Capabilities. Decide whether to add something.
- Consider an internal-traffic filter in Google Analytics after launch.

## Hosting and deployment (current)
- Host: Cloudflare Workers with static assets. Worker name `website`. Config in `wrangler.jsonc` (assets directory `./out`, 404 page handling).
- Build: Workers Builds from GitHub repo `JN493/website-`, branch `main`. Build command `npm run build`, deploy `npx wrangler deploy`. Every merge or push to `main` deploys.
- `next.config.ts`: `output: "export"`, `images.unoptimized`. Because of static export, dynamic routes need `generateStaticParams` returning at least one route.
- Versions: Next.js 16.3.8, React 19.2.8, Tailwind 4.3.3.
- Old iPhone support: `package.json` has a `browserslist` including `safari 15` and `ios_saf 15`. Without it, Next.js 16's own startup code (a class static block) fails on iOS 15 and no JavaScript runs. Tailwind v4 CSS needs Safari 15.4 or newer.
- Preview address (`workers.dev`) is protected by Cloudflare Access (Zero Trust, free plan): scope "All traffic", policy "Cloudflare account" (only members of the Cloudflare account). Set up 2026-10-07.
- Netlify is disconnected from the repo and no longer used (it ran out of build credits). The old site at slsfabs.netlify.app still exists.
- Domain slsfabrications.com: registered and DNS-hosted on Cloudflare (Full setup). Two DNS-only CNAME records (`@` and `www`) still point to `slsfabs.netlify.app`, so the public domain still shows the OLD site. The domain is NOT yet attached to the Worker. When attached, confirm the public domain opens without a login (Access must not cover it).
- slsfabrications.co.uk is purchased but parked and unconnected.

## Security headers (added 2026-10-09)
- `public/_headers` (copied by Next.js into `out/_headers`; Cloudflare Workers static assets applies it to asset responses, it is not served as a file). Format and limits: https://developers.cloudflare.com/workers/static-assets/headers/ (one splat per path, max 100 rules, 2,000 characters per line).
- All paths (`/*`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, and `Content-Security-Policy` (enforcing).
- `/_next/static/*`: `Cache-Control: public, max-age=31536000, immutable` (every file there is content-hashed or inside a build-ID folder).
- CSP is ENFORCING since 2026-10-14 (switched from report-only on the developer's request). Anything not allowed is blocked. Current policy (Google Tag Manager, Google Analytics and Cookiebot origins added 2026-10-21): default-src self; script-src self unsafe-inline https://challenges.cloudflare.com https://www.googletagmanager.com https://consent.cookiebot.com https://consentcdn.cookiebot.com; style-src self unsafe-inline; img-src self data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://imgsct.cookiebot.com; font-src self; connect-src self https://mvivwqyrtarryoomezgp.supabase.co https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://consentcdn.cookiebot.com https://consent.cookiebot.com; frame-src https://challenges.cloudflare.com https://www.google.com https://consentcdn.cookiebot.com; object-src none; base-uri self; form-action self; frame-ancestors none. unsafe-inline in script-src is needed for the Next.js static export inline scripts (tightening needs hashes). Google origins are from Google's "Google Analytics without any Ads features" list (https://developers.google.com/tag-platform/security/guides/csp); Cookiebot's from https://support.cookiebot.com/hc/en-us/articles/360018907220. https://consentcdn.cookiebot.com was added to script-src on 2026-10-22 because the preview console showed uc.js loading `consentcdn.cookiebot.com/consentconfig/<id>/state.js` and the CSP blocking it; that article lists no script hosts (it expects a nonce) but documents the same origin for connect-src and frame-src. Not allowed: Google Ads, Floodlight, GTM Preview Mode, Custom JavaScript variables (need unsafe-eval).
- Supabase storage uploads use the project origin because `useNewHostname` is not enabled in `src/lib/supabase.ts`. If it is ever enabled, add https://mvivwqyrtarryoomezgp.storage.supabase.co to connect-src.
- The policy MUST be updated BEFORE adding any new third-party service (or a GTM tag that loads from a new origin, such as Google Ads), or the enforcing CSP will block it.
- Strict-Transport-Security is NOT in `_headers`: HSTS is set in the Cloudflare dashboard at go-live.

## Search engine basics (built 2026-10-08)
- Per-page `metadata` (title, description, relative canonical) on every page; `metadataBase` is https://slsfabrications.com in `app/layout.tsx`. No title template, so page titles are used as-is. Contact metadata lives in `app/contact/layout.tsx` (the page is a client component). Strings are in `sls-content-draft.md`.
- `app/not-found.tsx` builds to `out/404.html`, served for unknown URLs via `not_found_handling: "404-page"` in `wrangler.jsonc`.
- `app/sitemap.ts` and `app/robots.ts` (`force-static`) build to `out/sitemap.xml` and `out/robots.txt`. Add new pages to the sitemap list.
- Icons: `app/favicon.ico`, `app/icon.png` (192x192), `app/apple-icon.png` (180x180), the SLS logo mark.
- Structured data: `src/components/LocalBusinessJsonLd.tsx` (rendered once in `app/layout.tsx`) outputs a schema.org LocalBusiness JSON-LD block (name, legalName, url, telephone, Companies House number, workshop address, opening hours Mon to Fri 07:30 to 17:00 matching the footer); `app/sitemap.ts` and `app/robots.ts` build `sitemap.xml` and `robots.txt`. RULE: only verified facts in structured data (no coordinates, socials, services, ratings, price range, email or logo until checked).

## Backend: Supabase
- Table `quote_requests` (name, company, phone, email, project details, `submission_description`, `file_paths text[]`, `consent_given_at`, and since 2026-10-22 `need_by` and `location`). Optional Company is sent as an empty string (column is NOT NULL). `need_by` and `location` are nullable text, max 100 characters (check constraints `quote_requests_need_by_length` / `quote_requests_location_length`), added by `supabase/quote-fields.sql`; not on `contacts`.
- Private storage bucket `quote-files`; uploads go to a random folder per submission.
- Row Level Security: anon can insert only (and only with consent recorded). No public read.
- Env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` live in local `.env.local` (git-ignored) and must also be in the Cloudflare build variables (baked in at build time). Never use or commit the service_role key or the Turnstile secret.
- Shared client in `src/lib/supabase.ts`.
- Tables `brochure_requests` (id, email, consent_given_at, created_at, sent_at nullable) and `job_applications` (id, name, email, file_path, consent_given_at, created_at), plus private bucket `cv-files` (5 MB, PDF/Word only). Defined in `supabase/brochure-and-careers.sql`, same insert-only RLS pattern as `quote_requests`. Written 2026-10-08; the developer runs it in the Supabase SQL Editor. Until it has been run, the brochure and careers forms show their error message.
- Spam protection on all three forms (quote, brochure, careers): hidden honeypot field named `website`, and a minimum fill time of 2 seconds. Shared helpers in `src/components/SpamGuard.tsx` (`Honeypot`, `useShownAt`, `looksLikeBot`). Bots see the normal thank-you message but nothing is uploaded or saved.

### Form submissions: Turnstile + Edge Function (code written 2026-10-08)
- All three forms submit through `src/lib/submitForm.ts`, which calls the Supabase Edge Function `submit-form` (`supabase/functions/submit-form/index.ts`, pasted into the dashboard editor). The forms no longer insert into tables or upload to storage with the anon client.
- Cloudflare Turnstile widget: `src/components/Turnstile.tsx` (explicit render, script from challenges.cloudflare.com, widget mode set to Managed in the Cloudflare dashboard). Site key 0x4AAAAAAFRSxpEQGtGG0m1N (public). Submit is blocked with a message until a token exists; the widget resets after every submission (tokens are single use).
- The function checks origin (slsfabrications.com, www, website.robstonesls77.workers.dev, localhost:3000), honeypot, verifies the token with Cloudflare siteverify using the Supabase secret `TURNSTILE_SECRET_KEY`, validates fields, consent and files server-side (quote: optional, up to 10 files, 20 MB each, also checked in the browser on the Contact page with messages; careers: exactly one .pdf/.doc/.docx up to 5 MB), creates signed upload URLs, inserts the row with the service role and sets `consent_given_at` itself. The browser then uploads files to the signed URLs.
- Quote only: `need_by` and `location` are optional, trimmed, stored as null when empty or whitespace-only, rejected over 100 characters (same "could not be accepted" error as other fields). Brochure and careers ignore them. Like the other text fields, there is no extra control-character filtering (trim and length only).
- Tests: `node supabase/functions/submit-form/test/submit-form.test.mjs` (shares the in-memory fake in `supabase/functions/retention-cleanup/test/fake-supabase.mjs`; Turnstile answered locally, no network).
- Known limitation: the row is saved before the files upload, so a failed upload can leave a row without its file.
- `tsconfig.json` excludes `supabase/` so the website build does not type-check the Deno function.
- Local testing: the real site key fails on localhost (Turnstile error 110200, hostname not allowed) unless localhost is added to the widget's hostnames. Cloudflare's always-pass test key `1x00000000000000000000AA` works anywhere for local builds.
- `supabase/lock-down-direct-inserts.sql` removes the anon INSERT policies and grants so the function is the only way in. Run it ONLY after the function is deployed and all three forms are tested through it.
- Lock-down SQL files, run in this order in the SQL Editor: (1) `supabase/save-current-policies.sql` (keep the result), (2) `supabase/lock-down-direct-inserts.sql`, (3) `supabase/lock-down-checks.sql` (both queries should return no rows).

### Tracking hooks, source capture and contacts (code written 2026-10-09)
- RULE: no cookies, localStorage, sessionStorage or IndexedDB anywhere on the site, except Cookiebot's own consent record. No analytics before consent. Our own code stores nothing; anything that needs remembering lives in JavaScript memory only.
- `src/lib/track.ts` `track(event)` pushes `{ event }` onto `window.dataLayer`, which Google Tag Manager reads. Event name only, never personal data.
- Cookiebot + Google Tag Manager (code written 2026-10-21): `app/layout.tsx` head loads, in this order (Cookiebot article "Google Tag Manager and Automatic cookie blocking", https://support.cookiebot.com/hc/en-us/articles/360009192739): (1) Google Consent Mode defaults (all denied except security_storage, wait_for_update 500, ads_data_redaction true, as the article shows; the article's url_passthrough line was removed 2026-10-21 because the site has no ads), (2) GTM container GTM-M995FM9J (no noscript iframe), (3) Cookiebot `uc.js`, Domain Group ID fbd2a6ae-76e6-4170-bb8d-46ced9c918cf, manual mode (no data-blockingmode="auto"). (1) and (2) have data-cookieconsent="ignore". Cookiebot is not a tag inside GTM. Next.js still puts its own async framework chunks and metadata above them in the head.
- Footer "Cookie settings" button (`src/components/CookieSettingsButton.tsx`) calls `Cookiebot.renew()`; does nothing if Cookiebot did not load.
- Cookiebot only shows its banner on domains in the domain group, so it never appears on localhost.
- Events: `quote_request_submitted`, `brochure_request_submitted`, `cv_submitted` fire only after a form fully succeeds (row saved and any file uploads finished), never on click, failure or the bot fake-success. `phone_click` and `email_click` fire from one delegated click listener for every `tel:` and `mailto:` link on the site.
- `src/components/SiteTracking.tsx` (mounted once in `app/layout.tsx`) holds that click listener and calls `captureSource()` on first load.
- Source (`src/lib/source.ts`), held in a module-level variable only (survives client-side navigation, lost on reload): `landing_page` (path only), `referrer` (other sites only, hostname plus path), `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` (trimmed, max 200). No gclid, fbclid or other IDs. `submitForm` sends it plus `submitted_from` (path at submit time) for quote and brochure only, never careers. The function keeps only known string values up to 200 characters, drops anything else and never rejects a submission over source data. Stored in matching columns on `quote_requests` and `brochure_requests`.
- `contacts` table: one contact per email address (stored lowercased and trimmed, unique on `lower(email)`) across quote and brochure requests. A repeat submission is a new enquiry row linked by `contact_id` to the same contact; repeats are never rejected. The function calls `upsert_contact()` (service role only) before inserting the row: it updates `last_seen_at` and only overwrites name, phone and company with non-empty values. If the contact step fails, no row is inserted. Job applicants are never added to contacts.
- Retention: delete a contact only when ALL its linked rows are past their retention period (quote: 12 months after last contact; brochure: 12 months after sent). The `contact_id` foreign keys block deleting a contact that still has linked rows.
- `contacts` and `upsert_contact()` are locked down (RLS on, no policies, no privileges for anon/authenticated). `supabase/lock-down-checks.sql` covers them.
- Run order for this change: (1) run `supabase/add-source-and-contacts.sql` in the Supabase SQL Editor, (2) deploy the updated `submit-form` function, (3) push the site. Pushing the site before steps 1 and 2 will make the quote and brochure forms fail. (Deploying the function before step 1 also breaks them, as it writes the new columns and calls `upsert_contact()`.)

### Retention clean-up (deployed in Supabase, runs daily at 03:30 UTC in dry-run mode, real deletion off)
- Edge Function `retention-cleanup` (`supabase/functions/retention-cleanup/index.ts`, Verify JWT OFF, service role). Every call must send the `x-retention-secret` header matching the function secret `RETENTION_CLEANUP_SECRET` (never in the repo).
- Rules (Rob's decisions), as constants at the top of the function (`RETENTION_MONTHS`, all 12): quote_requests 12 months after the linked contact's `last_seen_at` (row's `created_at` if no contact); brochure_requests 12 months after `sent_at` (`created_at` if never sent); job_applications 12 months after `created_at`; contacts 12 months after `last_seen_at` AND only when no quote or brochure request references them.
- Two phases per run. PLAN: every lookup, paged (`LOOKUP_PAGE_SIZE` = 100) so no batch limit can hide rows; if any lookup fails the run stops before deleting anything and `retention_log.error` records the step and error code. DELETE: files first (Storage API `remove`, then checked with `list`; already-missing counts as success), then the row; if a file cannot be deleted the row stays and is retried next run. Contacts last.
- A quote whose `contact_id` is set but whose contact is not returned by the lookup is SKIPPED (kept, counted as `skipped`); only a genuinely null `contact_id` uses the row's own `created_at`. A contact whose planned request could not be deleted is also skipped. Brochure deletion does not depend on the contact.
- DRY RUN by default: only `RETENTION_DELETE_ENABLED=true` really deletes. Kill switch: `RETENTION_KILL_SWITCH=on`. Cap: `MAX_DELETES_PER_TABLE_PER_RUN` = 100.
- `retention_log` (`supabase/retention.sql`): run time, dry_run, killed, per-table counts (would_delete / deleted / failed / skipped / more_remaining), and `error` (step name and code) when a run stopped. No personal data. RLS on, no policies, revoked from anon/authenticated; covered by `supabase/lock-down-checks.sql`.
- The `contact_id` foreign keys have no ON DELETE action (NO ACTION), so a referenced contact can never be deleted and nothing cascades.
- Schedule: `supabase/retention-schedule.sql` (pg_cron + pg_net, secret in Vault, daily 03:30 UTC), deployed and running in dry-run mode. To stop it: `select cron.unschedule('retention-cleanup-daily');` (also noted at the end of that file).
- Tests: `node supabase/functions/retention-cleanup/test/retention.test.mjs` (in-memory fake Supabase, no network). Real-project dry run: `supabase/retention-test-seed.sql` then `supabase/retention-test-remove.sql` (rows marked retention-test-...@example.invalid).

### Alert emails for quotes and job applications (code written 2026-10-22, not deployed, off)
- Each quote request and job application emails info@ (`ALERT_TO`, one recipient) with the full details. Brochure requests are NOT included: brochure alerts and brochure sending are not built yet.
- Sending: Microsoft Graph, client credentials flow with fetch only (no SDK): token from `login.microsoftonline.com/{GRAPH_TENANT_ID}/oauth2/v2.0/token`, then `POST /v1.0/users/{ALERT_FROM}/sendMail` with `saveToSentItems: false`. 10 second timeouts. Off unless `ALERTS_ENABLED` is exactly `true`: while off nothing is sent and no attempt is counted.
- Email: plain text. From `ALERT_FROM`, to `ALERT_TO`, Reply-To the enquirer only if the address passes validation. Subject "Website quote request from {name}" or "Website job application from {name}" (control characters including CR/LF removed, capped at 150). Body: submitted time (UK time), request id, then every filled-in field in the form's order (quote: name, company, location, phone, email, need by, project details, description; application: name, email); empty fields left out. Files: each file name with a signed link made at send time, valid 14 days (1209600 seconds), plus the date the links expire; a file that never uploaded gets a note instead.
- Who sends what: `submit-form` sends straight away (via `EdgeRuntime.waitUntil`, so the response is not delayed) only for quote requests WITHOUT files. The browser uploads files after the response, so quotes with files and every job application (always a CV) are sent by `alert-sweep` once they are over 10 minutes old. A failed alert never changes the visitor's response.
- `alert-sweep` (`supabase/functions/alert-sweep/index.ts`, Verify JWT OFF, service role): every call needs the `x-alert-secret` header matching `ALERT_SWEEP_SECRET`. Picks rows with `notified_at` null, `notify_attempts` under 5 and `created_at` over 10 minutes ago, newest first, at most 20 per run (stops starting new sends after about 100 seconds). Each try increments `notify_attempts`; success sets `notified_at`. Returns counts only.
- The alert code is one block, identical in both functions between `// ===== ALERT CODE START =====` and `// ===== ALERT CODE END =====` (each function is pasted into the dashboard on its own, so no shared import). A test fails if the two copies differ: change both together.
- Columns (`supabase/alerts.sql`): `notified_at timestamptz` and `notify_attempts int not null default 0` on `quote_requests` and `job_applications`. Rows that exist when `notified_at` is first added are marked as notified, so old data never triggers alerts (a second run does not re-mark newer rows).
- Schedule: `supabase/alerts-schedule.sql` (pg_cron + pg_net, every 15 minutes, secret from Vault `alert_sweep_secret`, `project_url` reused from the retention setup). NOT run automatically. Stop it with `select cron.unschedule('alert-sweep-15min');`.
- Logs: ids, statuses and counts only, never personal data (tested).
- Secrets (function secrets in the dashboard, never in the repo): `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `ALERT_FROM`, `ALERT_TO`, `ALERT_SWEEP_SECRET`, `ALERTS_ENABLED`. `submit-form` needs all but `ALERT_SWEEP_SECRET`; `alert-sweep` needs all of them.
- Microsoft setup needed first: a mailbox to send from (`ALERT_FROM`); an Entra app registration with the Graph application permission Mail.Send, restricted to that one mailbox (not the whole tenant); a client secret for it, with a reminder set before it expires (alerts stop when it does).
- Mailbox retention: the alert emails contain the same personal data as the requests, so the info@ mailbox's retention must also cover them.
- Production order: (1) run `supabase/alerts.sql`; (2) deploy `submit-form` and `alert-sweep` (Verify JWT off for alert-sweep); (3) add the secrets but leave `ALERTS_ENABLED` unset; (4) when Microsoft is ready, set `ALERTS_ENABLED=true` and run `supabase/alerts-schedule.sql`.
- Tests: `node supabase/functions/submit-form/test/alerts.test.mjs` and `node supabase/functions/alert-sweep/test/alert-sweep.test.mjs` (fake Supabase + fake Graph in `supabase/functions/submit-form/test/fake-graph.mjs`, no network). The real Graph call has not been tested.

## Site structure (agreed)
Five pages: **About, Capabilities, Industries, Projects, Contact** (no "Our" prefix). Footer has Find Us, Call Us, Opening Hours, a click-to-load Google Map, links to Privacy, Terms, Cookies and a "Cookie settings" button.
- Footer map (`src/components/MapEmbed.tsx`): nothing is requested from Google until the visitor clicks "Show map" (placeholder line: "Loads a map from Google. See our Cookie Policy."). Then the same embed iframe loads. Built 2026-10-08. Position: right-hand fourth column of the footer grid from `lg` (1024px) up; below that it stacks under the other columns at full width, max 400px. Size is set once in `Footer.tsx` (`mapSize`: `--map-w` 280px, `--map-h` 180px). The "Get directions" link also only contacts Google when clicked.
- **About**: placeholder. Needs team, workshop photo, mission statement (from Rob).
- **Capabilities**: tile grid, built. See below.
- **Industries**: tile grid with titles only, built. Same TileGrid component as Capabilities. Not clickable yet. 12 sectors, no client names. Sector wording to be confirmed with Rob.
- **Projects**: brochure form only (`src/components/BrochureForm.tsx`), no case studies, careers link or Request a Quote link yet. Case studies pending photos.
- **Contact**: intro line, then three cards (stacked below `lg`, three side by side from `lg`, 1024px): "Request a Quote" (opens the quote form; heading changes to "Request a Quote" while open; field order: Name, Company, Location (town or area), Phone, Email, Need by (no hint), Project details, Describe what you're submitting, Upload drawings / files, consent; required: Name, Phone, Email and consent; need_by and location are free text, max 100, no autocomplete, no date input), "Talk to the Team" (`mailto:info@slsfabrications.com`, mailbox not created yet, plus a tel: link to 01323 846061), and "Join Our Team" (links to /careers; line: "No current vacancies, but we'd like to hear from you. Send us your CV.").
- **Careers** (`/careers`, not in the main nav, in the sitemap): "Join Our Team" with a CV form (`src/components/CareersForm.tsx`): name, email, CV (.pdf/.doc/.docx, max 5 MB, checked in the browser and by the bucket) and required consent. Uploads to `cv-files`, then inserts into `job_applications`.
- Mobile nav: hamburger menu below the `md` breakpoint (built and tested on iPhone 7 Plus).
- No "Request a quote" buttons on the Capabilities or Industries pages (decision by the developer).

### Capabilities page (built)
- `src/lib/capabilities.ts` holds the 12 items in workflow order, with `slug`, `title`, `description`, optional `image`, and `ready` (all false).
- `src/components/TileGrid.tsx`: 3 columns on desktop (lg), 2 on tablet (sm), 1 on phone. Each tile has a 4:3 image box (mid-dark steel grey placeholder until a photo exists) with the title bottom-left in white over a dark gradient, and the description underneath. Tiles are links only when `ready` is true and an `href` is passed; otherwise plain.
- Detail pages (`app/capabilities/[slug]`) are NOT built: Next.js static export fails on a dynamic route with no routes. Add the template back when the first capability has real content and is marked ready, and make the Capabilities page pass an `href` for ready items in the same change.
- To add a photo: put it in `public/images/capabilities/<slug>.jpg` (resize first, phone photos are several MB), set `image`, set `ready: true` when the detail page has content.
- Order: On-Site Surveying, CAD Design, Laser Cutting, Punching, Folding, Rolling, Tube Bending, CNC Machining, Welding, Finishing, Powder Coating, Delivery.
- The current copy (signed off by the developer) is kept word for word from `src/lib/capabilities.ts` until the consultant's copy replaces it. It is not final; do not rewrite it in between. Laser Cutting, CNC Machining and Powder Coating copy was drafted from the old Partner Services paragraph with no specifics and approved on 2026-10-08. Do not mention "partner" in the tile copy (the developer will cover it on a detail page later). Finishing's block title was shortened to "Finishing" and its description names polishing, galvanisation and chemical oxidation.

## Brochure download (Projects page)
- Built 2026-10-08: the form collects only an email address with a REQUIRED consent checkbox, and inserts a row into `brochure_requests`. The thank-you says "Thanks, we'll send you the brochure shortly." Nothing is emailed yet and no PDF exists.
- Still to build: emailing the brochure PDF (sets `sent_at`). The PDF does not exist yet, so build it so the file can be dropped in later.
- Needs an email-sending service and a Supabase Edge Function (sending cannot happen from a static site). Sending domain needs SPF and DKIM records in Cloudflare DNS. A domain can have only ONE SPF record, shared with Microsoft 365, so any SPF change must be reviewed before it is made.
- Consent wording must be decided (see open items). Marketing/mailing list consent should be a separate unticked box and the brochure must not depend on it.
- Cannot go live on the real domain until the Privacy Policy covers it.

## Design direction
- Rejected: dark, heavy industrial theme.
- Target: clean, premium, light, like a high-end engineering firm.
- Redesign built 2026-10-21 (contemporary, white space, modest rounded corners like the logo). Home: "SLS Fabrications" h1 and the tagline "Sheet metal and welding specialists, bespoke service & designs from small to large scale projects." (also the home meta description), then `src/components/HeroCarousel.tsx`: team, welding, laser (TEST IMAGES, see Launch blockers); right to left including the wrap, 6s per slide, 600ms (keyframes `hero-in`/`hero-out` in `app/globals.css`); one dark pill bottom right holding the pause/play control (left end, drawn at the same 10px scale and white as the dots, 44x44 hit area, required by WCAG 2.2.2) and the three dots; pauses on hover and focus; reduced motion starts paused with no animation. Hero images: `public/images/hero/<name>-<width>.webp` (640/1280/1920, never upscaled).

## Design system (2026-10-21)
- Tokens in `app/globals.css` `@theme`: brand #004167, brand-dark #002f4b (hover), tint #eef4f8, tint-2 #dde9f1, ink #14212b (text), muted #4a5c69 (secondary text), line #d4dfe7 (decorative borders), field #6b7f8e (form control borders), steel #2d4a5e (image placeholder). Contrast checked: ink 16.38:1 on white / 14.76:1 on tint; muted 6.94 / 6.26; brand 10.76 / 9.70; white on brand 10.76; footer text (white 80%) on brand 7.47; field border 4.16; error red 6.47 / 5.83.
- Font: Inter via `next/font/google` (self-hosted at build, `font-src 'self'`). No requests to Google font hosts.
- Shared classes (`@layer components`): `container-page`, `btn` + `btn-primary` (solid brand) / `btn-secondary` (brand outline), `field`, `field-label`, `card`. `src/components/PageHeader.tsx` is the tinted title band on every page except home.
- Logo: `public/images/logo/logo-blue(@2x).png` (header) and `logo-white(@2x).png` (footer), 102x52 display, made from `design-assets/logo-black.png`. React 19 adds a `<link rel="preload">` for every non-lazy `<img>` using only its srcSet, so: the header logo lists both candidates (`logo-blue.png 1x, logo-blue@2x.png 2x`) so the preload matches the image; the footer logo is `loading="lazy"` so it is not preloaded (the preload went unused, browser warning, 2026-10-22). `app/icon.png` unchanged.
- Accent line: class `accent-line` (`app/globals.css`) draws a 48x3px brand-blue line 0.75rem under a heading with `::after` (no extra elements, follows `text-center`). Used on the PageHeader h1 and the section h2s of the legal pages. Opt-in only: never on card headings (Contact cards, Projects card, tiles), the home hero title, the footer or any dark area.
- Scroll reveal: `src/components/Reveal.tsx` (wraps an element: `<Reveal as="li|section|div">`) fades it up 16px over 500ms, once, when it first scrolls into view (IntersectionObserver). Used on the Capabilities/Industries tiles and the Contact cards only. Never on the header, hero, footer, forms, the Cookie settings button or anything above the fold. Rules: the server HTML has no `data-reveal`, so with no JavaScript everything is visible; nothing is hidden until the visitor first scrolls, and then only elements still fully below the viewport (so no flash, no layout shift, full-page screenshots show everything); print and `prefers-reduced-motion: reduce` never hide anything; focus inside a hidden element shows it at once (`data-reveal="instant"`, no fade). No storage.
- Tile hover (TileGrid, `.tile` / `.tile-text` / `.tile-desc` in `app/globals.css`): on hover (inside `@media (hover: hover)`, so touch screens never stick) and on `:focus-within`, the title and description lift 6px over 200ms ease-out and a light grey gradient (transparent to #eceef0) fades in behind the description. The image, layout and tile size never change. Reduced motion: no lift, gradient still appears. Description text on the strongest grey: 5.97:1. Tiles are not links, so no `cursor: pointer`; add it with the link variant when tiles get an href.
- Header is sticky (height `--header-h`, 4.5rem); `html { scroll-padding-top }` keeps anchors and focused elements clear of it. Footer is brand blue with white text; all text flush left; the white logo (decorative, `alt=""`) is in the last row, bottom right, after the copyright line (`ml-auto`, so it stays right when the row wraps on narrow screens), below the map column on desktop.
- `design-assets/` (not in `public/`) holds the source logo and photos plus `SOURCES.md` credits.

## Accessibility and theme conventions (2026-10-14)
- Light-only by design: no dark mode. `app/globals.css` sets `color-scheme: light` on `:root`; there is no `prefers-color-scheme` CSS and no `dark:` classes. The Turnstile widget is forced to `theme: "light"`.
- Skip link: "Skip to content" is the first focusable element on every page (`app/layout.tsx`), hidden until focused, pointing at `<main id="main">`. Every page's `<main>` must keep `id="main"`.
- Focus ring: site-wide `:focus-visible` in `app/globals.css` (base layer): 2px solid #2563eb, 2px offset (5.17:1 on white, 4.66:1 on the tint). On dark blue it is only 2.08:1, so areas with class `on-dark` (footer, carousel controls) use a white ring; `on-light` inside them switches back (footer map placeholder). Do not remove outlines.
- Form labels carry no markers (no "(optional)", "(required)" or asterisks; changed 2026-10-22). Required fields use the native `required` attribute, so the browser prompt and screen readers know; optional fields are unmarked.
- Form success: each form keeps an always-present, empty `<p role="status" aria-live="polite" tabIndex={-1}>`. On success it is filled with the thanks message and receives focus, so the confirmation is announced and focus is not lost when the form is replaced.
- Contact: opening the quote form moves focus to Name; "Back" returns focus to "Request a Quote". Mobile menu: Escape closes it and returns focus to the button.
- Hints and error messages sit outside `<label>` and are linked with `aria-describedby`, so a field's accessible name is just its label.

## Style and voice notes (explicit feedback from the developer)
- Accuracy first. Check facts or ask before adding details. Never invent specifics (materials, capacity, certifications, client names).
- Do not add content that wasn't asked for. Make small edits to existing copy, do not rewrite wholesale.
- No em dashes in site copy, headings included. (Code comments are not site copy.) Avoid repeating phrases like "your project" across sections. Plain, concise tone. Must not read as AI-generated.
- Client company names must not be published without explicit permission.

## Legal and compliance status
- Privacy Policy, Terms of Use, Cookie Policy: approved text live since 2026-10-08 ("Last updated: 8 October 2026"), word for word in `app/privacy`, `app/terms`, `app/cookies`. The Privacy Policy still shows "ICO registration number: [add once registered]" until the policy rewrite. Privacy Policy updated 2026-10-09 ("Last updated: 9 October 2026") with the "Where you found us." paragraph and the one-contact-record sentence. They state: no analytics or advertising, the site sets no cookies of its own, Supabase database in London, Turnstile on the forms, Google Maps only after a click, 12-month retention for quote, brochure and CV data. Any change to the site that affects these (analytics, new services, cookies, retention) needs the policies updated first.
- Privacy Policy changes to bundle later (not yet in the policy text): quote requests now also hold an optional "need by" note and an optional company location (town or area), kept and deleted with the request (12 months after last contact).
- The company is registered with the ICO, number ZC269397 (to be checked against the certificate and the ICO register). The number goes into the Privacy Policy in the policy rewrite.
- Analytics: GA4 runs through Google Tag Manager (container GTM-M995FM9J, published) behind Cookiebot consent; details in Project status. The Privacy Policy and Cookie Policy ("stores nothing in the browser", no analytics) are out of date and must be updated before go-live.

## Microsoft 365 email (staying; admin access being set up)
- The company has an existing Microsoft 365 subscription but the developer's login is a normal user, not an admin ("account doesn't have permission"). Needs a Global Admin login from Rob or the IT provider.
- Email stays on Microsoft 365; Google Workspace was dropped.
- Plan once admin access exists: add and verify slsfabrications.com in Microsoft (TXT verification record in Cloudflare DNS), CNAME `autodiscover` to `autodiscover.outlook.com` set to DNS only, create `info@slsfabrications.com` as a shared mailbox, test send and receive, enable DKIM. DMARC later.
- Do not add or change MX or SPF records until they have been reviewed.
- The website alert emails (see "Alert emails" under Backend) also need Microsoft: a sending mailbox and an Entra app with Mail.Send restricted to it.
- Do not change nameservers (the domain is already on Cloudflare). Do not touch the two website CNAMEs until the Worker is attached.

## Working agreements
- The developer pastes between Claude (chat, plans and prompts) and Claude Code (implementation). Claude Code does the code, tests in a real browser, and reports back.
- Commit with clear messages. Run lint and `npm run build` before reporting. Do not add dependencies without asking.
- Do not push unless the developer asks (from 2026-10-22; replaces the earlier rule that allowed pushing to `main` without asking before the domain was attached).
- Keep this file and `sls-content-draft.md` up to date as work happens, but only with changes that are certain (done, tested, or explicitly decided). Do not record guesses or unconfirmed plans as fact.
- Test on a real phone when possible (an iPhone 7 Plus caught a bug that simulated testing missed).
- Past issue (resolved): duplicate `app` folders (`src/app/` and root `app/`) broke routing. All pages live in the root `app/`. Shared components are in `src/components/`.

## Launch blockers
- Home hero uses TEST IMAGES (marked "TEST IMAGE: replace before launch" in `src/components/HeroCarousel.tsx`; credits in `design-assets/SOURCES.md`). The team photo (Bhupathi Srinu) and the laser photo (Clayton Cardinalli) are Unsplash test images, and the team photo is NOT SLS staff. The welding photo is SLS's own but only 382x510; a full-size original is needed.

## Open items
- Rob: Microsoft admin login, mission statement, workshop photos, sector name wording, permission to name any clients, brochure PDF.
- Rachael: proposed an optional "How did you hear about us?" field on the quote form (not yet agreed), plus Google Search Console and Google Business Profile.
- Rob: asked 2026-10-08 about recovering the company Facebook page.
- Lock-down (not recorded as done in Project status; confirm before acting): run `supabase/save-current-policies.sql` (keep the result), `supabase/lock-down-direct-inserts.sql` and `supabase/lock-down-checks.sql` (all queries return no rows, the contacts check returns relrowsecurity = true), then one real test per form. Already done and covered by Project status: `submit-form` with Turnstile, the site key build variable, the source columns and the contacts table.
- Add the ICO registration number (ZC269397, once checked) to the Privacy Policy as part of the policy rewrite.
- Alert emails (in this order): run `supabase/alerts.sql`; deploy `submit-form` and `alert-sweep`; add the secrets with `ALERTS_ENABLED` unset; when Microsoft is ready, set `ALERTS_ENABLED=true` and run `supabase/alerts-schedule.sql`. Details under "Alert emails".
- Quote fields need_by and location (in this order): (1) run `supabase/quote-fields.sql` in the SQL Editor, (2) redeploy the `submit-form` function, (3) push the site. Deploying the function before step 1 makes every quote fail (it inserts the new columns).
- Retention clean-up (deployed, dry run): still open are the real-deletion test with fake rows and, before about October 2027, reviewing `retention_log` and setting `RETENTION_DELETE_ENABLED=true` only when the dry-run counts look right.
- Build: brochure emailing, Projects case studies, About page, homepage, attach domain to Worker, retire the old Netlify site.
