# SLS Fabrications Website: Project Context

Last updated: 2026-10-21. Keep this file current: after any task that changes the site, hosting, content decisions or status, update the relevant section in the same commit.

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
- CSP is ENFORCING since 2026-10-14 (switched from report-only on the developer's request). Anything not allowed is blocked. Current policy (Google Tag Manager, Google Analytics and Cookiebot origins added 2026-10-21): default-src self; script-src self unsafe-inline https://challenges.cloudflare.com https://www.googletagmanager.com https://consent.cookiebot.com; style-src self unsafe-inline; img-src self data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://imgsct.cookiebot.com; font-src self; connect-src self https://mvivwqyrtarryoomezgp.supabase.co https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://consentcdn.cookiebot.com https://consent.cookiebot.com; frame-src https://challenges.cloudflare.com https://www.google.com https://consentcdn.cookiebot.com; object-src none; base-uri self; form-action self; frame-ancestors none. unsafe-inline in script-src is needed for the Next.js static export inline scripts (tightening needs hashes). Google origins are from Google's "Google Analytics without any Ads features" list (https://developers.google.com/tag-platform/security/guides/csp); Cookiebot's from https://support.cookiebot.com/hc/en-us/articles/360018907220. Not allowed: Google Ads, Floodlight, GTM Preview Mode, Custom JavaScript variables (need unsafe-eval).
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

### Retention clean-up (code written 2026-10-14, not deployed)
- Edge Function `retention-cleanup` (`supabase/functions/retention-cleanup/index.ts`, Verify JWT OFF, service role). Every call must send the `x-retention-secret` header matching the function secret `RETENTION_CLEANUP_SECRET` (never in the repo).
- Rules (Rob's decisions), as constants at the top of the function (`RETENTION_MONTHS`, all 12): quote_requests 12 months after the linked contact's `last_seen_at` (row's `created_at` if no contact); brochure_requests 12 months after `sent_at` (`created_at` if never sent); job_applications 12 months after `created_at`; contacts 12 months after `last_seen_at` AND only when no quote or brochure request references them.
- Two phases per run. PLAN: every lookup, paged (`LOOKUP_PAGE_SIZE` = 100) so no batch limit can hide rows; if any lookup fails the run stops before deleting anything and `retention_log.error` records the step and error code. DELETE: files first (Storage API `remove`, then checked with `list`; already-missing counts as success), then the row; if a file cannot be deleted the row stays and is retried next run. Contacts last.
- A quote whose `contact_id` is set but whose contact is not returned by the lookup is SKIPPED (kept, counted as `skipped`); only a genuinely null `contact_id` uses the row's own `created_at`. A contact whose planned request could not be deleted is also skipped. Brochure deletion does not depend on the contact.
- DRY RUN by default: only `RETENTION_DELETE_ENABLED=true` really deletes. Kill switch: `RETENTION_KILL_SWITCH=on`. Cap: `MAX_DELETES_PER_TABLE_PER_RUN` = 100.
- `retention_log` (`supabase/retention.sql`): run time, dry_run, killed, per-table counts (would_delete / deleted / failed / skipped / more_remaining), and `error` (step name and code) when a run stopped. No personal data. RLS on, no policies, revoked from anon/authenticated; covered by `supabase/lock-down-checks.sql`.
- The `contact_id` foreign keys have no ON DELETE action (NO ACTION), so a referenced contact can never be deleted and nothing cascades.
- Schedule: `supabase/retention-schedule.sql` (pg_cron + pg_net, secret in Vault, daily 03:30 UTC). NOT run automatically.
- Tests: `node supabase/functions/retention-cleanup/test/retention.test.mjs` (in-memory fake Supabase, no network). Real-project dry run: `supabase/retention-test-seed.sql` then `supabase/retention-test-remove.sql` (rows marked retention-test-...@example.invalid).

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
- Copy is signed off by the developer. Use it word for word from `src/lib/capabilities.ts`. Laser Cutting, CNC Machining and Powder Coating copy was drafted from the old Partner Services paragraph with no specifics and approved on 2026-10-08. Do not mention "partner" in the tile copy (the developer will cover it on a detail page later). Finishing's block title was shortened to "Finishing" and its description names polishing, galvanisation and chemical oxidation.

## Brochure download (Projects page)
- Built 2026-10-08: the form collects only an email address with a REQUIRED consent checkbox, and inserts a row into `brochure_requests`. The thank-you says "Thanks, we'll send you the brochure shortly." Nothing is emailed yet and no PDF exists.
- Still to build: emailing the brochure PDF (sets `sent_at`). The PDF does not exist yet, so build it so the file can be dropped in later.
- Needs an email-sending service and a Supabase Edge Function (sending cannot happen from a static site). Sending domain needs SPF and DKIM records in Cloudflare DNS. A domain can have only ONE SPF record, so it must be merged with Microsoft 365's (`include:spf.protection.outlook.com`).
- Consent wording must be decided (see open items). Marketing/mailing list consent should be a separate unticked box and the brochure must not depend on it.
- Cannot go live on the real domain until ICO registration is done and the Privacy Policy covers it.

## Design direction
- Rejected: dark, heavy industrial theme.
- Target: clean, premium, light, like a high-end engineering firm.
- Redesign built 2026-10-21 (contemporary, white space, modest rounded corners like the logo). Home: "SLS Fabrications" h1 and the tagline "Sheet metal and welding specialists, bespoke service & designs from small to large scale projects." (also the home meta description), then `src/components/HeroCarousel.tsx`: team, welding, laser (TEST IMAGES, see Launch blockers); right to left including the wrap, 6s per slide, 600ms (keyframes `hero-in`/`hero-out` in `app/globals.css`); one dark pill bottom right holding the pause/play control (left end, drawn at the same 10px scale and white as the dots, 44x44 hit area, required by WCAG 2.2.2) and the three dots; pauses on hover and focus; reduced motion starts paused with no animation. Hero images: `public/images/hero/<name>-<width>.webp` (640/1280/1920, never upscaled).

## Design system (2026-10-21)
- Tokens in `app/globals.css` `@theme`: brand #004167, brand-dark #002f4b (hover), tint #eef4f8, tint-2 #dde9f1, ink #14212b (text), muted #4a5c69 (secondary text), line #d4dfe7 (decorative borders), field #6b7f8e (form control borders), steel #2d4a5e (image placeholder). Contrast checked: ink 16.38:1 on white / 14.76:1 on tint; muted 6.94 / 6.26; brand 10.76 / 9.70; white on brand 10.76; footer text (white 80%) on brand 7.47; field border 4.16; error red 6.47 / 5.83.
- Font: Inter via `next/font/google` (self-hosted at build, `font-src 'self'`). No requests to Google font hosts.
- Shared classes (`@layer components`): `container-page`, `btn` + `btn-primary` (solid brand) / `btn-secondary` (brand outline), `field`, `field-label`, `card`. `src/components/PageHeader.tsx` is the tinted title band on every page except home.
- Logo: `public/images/logo/logo-blue(@2x).png` (header) and `logo-white(@2x).png` (footer), 102x52 display, made from `design-assets/logo-black.png`. `app/icon.png` unchanged.
- Accent line: class `accent-line` (`app/globals.css`) draws a 48x3px brand-blue line 0.75rem under a heading with `::after` (no extra elements, follows `text-center`). Used on the PageHeader h1 and the section h2s of the legal pages. Opt-in only: never on card headings (Contact cards, Projects card, tiles), the home hero title, the footer or any dark area.
- Scroll reveal: `src/components/Reveal.tsx` (wraps an element: `<Reveal as="li|section|div">`) fades it up 16px over 500ms, once, when it first scrolls into view (IntersectionObserver). Used on the Capabilities/Industries tiles and the Contact cards only. Never on the header, hero, footer, forms, the Cookie settings button or anything above the fold. Rules: the server HTML has no `data-reveal`, so with no JavaScript everything is visible; nothing is hidden until the visitor first scrolls, and then only elements still fully below the viewport (so no flash, no layout shift, full-page screenshots show everything); print and `prefers-reduced-motion: reduce` never hide anything; focus inside a hidden element shows it at once (`data-reveal="instant"`, no fade). No storage.
- Tile hover (TileGrid, `.tile` / `.tile-text` / `.tile-desc` in `app/globals.css`): on hover (inside `@media (hover: hover)`, so touch screens never stick) and on `:focus-within`, the title and description lift 6px over 200ms ease-out and a light grey gradient (transparent to #eceef0) fades in behind the description. The image, layout and tile size never change. Reduced motion: no lift, gradient still appears. Description text on the strongest grey: 5.97:1. Tiles are not links, so no `cursor: pointer`; add it with the link variant when tiles get an href.
- Header is sticky (height `--header-h`, 4.5rem); `html { scroll-padding-top }` keeps anchors and focused elements clear of it. Footer is brand blue with white text.
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
- Avoid em dashes in body copy (fine in headings). Avoid repeating phrases like "your project" across sections. Plain, concise tone. Must not read as AI-generated.
- Client company names must not be published without explicit permission.

## Legal and compliance status
- Privacy Policy, Terms of Use, Cookie Policy: approved text live since 2026-10-08 ("Last updated: 8 October 2026"), word for word in `app/privacy`, `app/terms`, `app/cookies`. The Privacy Policy deliberately shows "ICO registration number: [add once registered]" until ICO registration is done. Privacy Policy updated 2026-10-09 ("Last updated: 9 October 2026") with the "Where you found us." paragraph and the one-contact-record sentence. They state: no analytics or advertising, the site sets no cookies of its own, Supabase database in London, Turnstile on the forms, Google Maps only after a click, 12-month retention for quote, brochure and CV data. Any change to the site that affects these (analytics, new services, cookies, retention) needs the policies updated first.
- Privacy Policy changes to bundle later (not yet in the policy text): quote requests now also hold an optional "need by" note and an optional company location (town or area), kept and deleted with the request (12 months after last contact).
- Company is NOT yet registered with the ICO. This must be done before any live data collection (quote form, brochure, analytics) on the real domain.
- Analytics: undecided. The developer leans Google Analytics for now; Rachael to confirm. Google Analytics needs a consent banner before go-live (UK PECR). Plausible/Fathom were the alternatives (no cookie banner). Cookiebot and Google Tag Manager are in the code (2026-10-21); the Privacy Policy and Cookie Policy ("stores nothing in the browser", no analytics) are now out of date and must be updated before this goes live.

## Microsoft 365 email (blocked)
- The company has an existing Microsoft 365 subscription but the developer's login is a normal user, not an admin ("account doesn't have permission"). Needs a Global Admin login from Rob or the IT provider.
- Plan once admin access exists: add and verify slsfabrications.com in Microsoft, add DNS records in Cloudflare (TXT verification, MX to `slsfabrications-com.mail.protection.outlook.com` priority 0, CNAME `autodiscover` to `autodiscover.outlook.com` set to DNS only, SPF TXT `v=spf1 include:spf.protection.outlook.com -all`), create `info@slsfabrications.com` as a shared mailbox, test send and receive. DKIM and DMARC later.
- Do not change nameservers (the domain is already on Cloudflare). Do not touch the two website CNAMEs until the Worker is attached.

## Working agreements
- The developer pastes between Claude (chat, plans and prompts) and Claude Code (implementation). Claude Code does the code, tests in a real browser, and reports back.
- Commit with clear messages. Run lint and `npm run build` before reporting. Do not add dependencies without asking.
- Pushing to `main` is allowed without asking while slsfabrications.com is NOT attached to the Worker (agreed 2026-10-08). Once the domain is attached, go back to asking before every push.
- Keep this file and `sls-content-draft.md` up to date as work happens, but only with changes that are certain (done, tested, or explicitly decided). Do not record guesses or unconfirmed plans as fact.
- Test on a real phone when possible (an iPhone 7 Plus caught a bug that simulated testing missed).
- Past issue (resolved): duplicate `app` folders (`src/app/` and root `app/`) broke routing. All pages live in the root `app/`. Shared components are in `src/components/`.

## Launch blockers
- Home hero uses TEST IMAGES (marked "TEST IMAGE: replace before launch" in `src/components/HeroCarousel.tsx`; credits in `design-assets/SOURCES.md`). The team photo (Bhupathi Srinu) and the laser photo (Clayton Cardinalli) are Unsplash test images, and the team photo is NOT SLS staff. The welding photo is SLS's own but only 382x510; a full-size original is needed.

## Open items
- Rob: Microsoft admin login, ICO registration, mission statement, workshop photos, sector name wording, permission to name any clients, brochure PDF.
- Rachael: analytics decision (Google Analytics with banner, or Plausible). Asked 2026-10-08. Key deciding question put to her: is paid advertising (Google Ads) planned? Also proposed an optional "How did you hear about us?" field on the quote form (not yet agreed), plus Google Search Console and Google Business Profile.
- Rob: asked 2026-10-08 about recovering the company Facebook page.
- Supabase / Turnstile (in this order): create the `submit-form` function in the dashboard and paste the code, set the `TURNSTILE_SECRET_KEY` secret, add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to the Cloudflare build variables, push, test all three forms on the preview, then run `supabase/save-current-policies.sql` (keep the result), `supabase/lock-down-direct-inserts.sql` and `supabase/lock-down-checks.sql`, and test again.
- Add the ICO registration number to the Privacy Policy once registered.
- Quote fields need_by and location (in this order): (1) run `supabase/quote-fields.sql` in the SQL Editor, (2) redeploy the `submit-form` function, (3) push the site. Deploying the function before step 1 makes every quote fail (it inserts the new columns).
- Tracking and contacts (in this order): run `supabase/add-source-and-contacts.sql`, deploy the updated `submit-form` function, then push the site; then one real test per form and run `supabase/lock-down-checks.sql` (all queries return no rows, the last returns relrowsecurity = true).
- Retention clean-up (in this order): run `supabase/retention.sql`; deploy `retention-cleanup` (Verify JWT off) with secret `RETENTION_CLEANUP_SECRET`; run `supabase/retention-test-seed.sql`, call the function once (dry run), check `retention_log`, run `supabase/retention-test-remove.sql`; then `supabase/retention-schedule.sql`; set `RETENTION_DELETE_ENABLED=true` only when the dry-run counts look right.
- Build: brochure emailing, Projects case studies, About page, homepage, attach domain to Worker, retire the old Netlify site.
