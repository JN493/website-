# SLS Fabrications Website: Project Context

Last updated: 2026-10-08. Keep this file current: after any task that changes the site, hosting, content decisions or status, update the relevant section in the same commit.

## About the business
SLS Fabrications is a welding and steel fabrication workshop based in Hailsham, East Sussex, UK.
- Address: Unit 2 Hythe Works, Diplocks Way, Hailsham, BN27 3JF, United Kingdom
- Phone: 01323 846061
- Hours: Mon to Fri, 7:30am to 5:00pm
- Small team (5 to 15 people)
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

## Search engine basics (built 2026-10-08)
- Per-page `metadata` (title, description, relative canonical) on every page; `metadataBase` is https://slsfabrications.com in `app/layout.tsx`. No title template, so page titles are used as-is. Contact metadata lives in `app/contact/layout.tsx` (the page is a client component). Strings are in `sls-content-draft.md`.
- `app/not-found.tsx` builds to `out/404.html`, served for unknown URLs via `not_found_handling: "404-page"` in `wrangler.jsonc`.
- `app/sitemap.ts` and `app/robots.ts` (`force-static`) build to `out/sitemap.xml` and `out/robots.txt`. Add new pages to the sitemap list.
- Icons: `app/favicon.ico`, `app/icon.png` (192x192), `app/apple-icon.png` (180x180), the SLS logo mark.

## Backend: Supabase
- Table `quote_requests` (name, company, phone, email, project details, `submission_description`, `file_paths text[]`, `consent_given_at`). Optional Company is sent as an empty string (column is NOT NULL).
- Private storage bucket `quote-files`; uploads go to a random folder per submission.
- Row Level Security: anon can insert only (and only with consent recorded). No public read.
- Env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Cloudflare build variables and in local `.env.local` (baked in at build time). Never use or commit the service_role key.
- Shared client in `src/lib/supabase.ts`.
- Spam protection on the quote form: hidden honeypot field named `website`, and a minimum fill time of 2 seconds. Bots see the normal thank-you message but nothing is uploaded or saved. Stronger protection (Cloudflare Turnstile checked by a Supabase function) is planned before go-live.

## Site structure (agreed)
Five pages: **About, Capabilities, Industries, Projects, Contact** (no "Our" prefix). Footer has Find Us (map), Call Us, Opening Hours and links to Privacy, Terms, Cookies.
- **About**: placeholder. Needs team, workshop photo, mission statement (from Rob).
- **Capabilities**: tile grid, built. See below.
- **Industries**: tile grid with titles only, built. Same TileGrid component as Capabilities. Not clickable yet. 12 sectors, no client names. Sector wording to be confirmed with Rob.
- **Projects**: not built. Plan: case studies (pending photos), brochure download (see below), Request a Quote entry point linking to `/contact#quote`, careers link.
- **Contact**: "Request a Quote" (opens the quote form) and "Talk to the Team" (`mailto:info@slsfabrications.com`, mailbox not created yet). Heading changes to "Request a Quote" while the form is open.
- Mobile nav: hamburger menu below the `md` breakpoint (built and tested on iPhone 7 Plus).
- No "Request a quote" buttons on the Capabilities or Industries pages (decision by the developer).

### Capabilities page (built)
- `src/lib/capabilities.ts` holds the 12 items in workflow order, with `slug`, `title`, `description`, optional `image`, and `ready` (all false).
- `src/components/TileGrid.tsx`: 3 columns on desktop (lg), 2 on tablet (sm), 1 on phone. Each tile has a 4:3 image box (mid-dark steel grey placeholder until a photo exists) with the title bottom-left in white over a dark gradient, and the description underneath. Tiles are links only when `ready` is true and an `href` is passed; otherwise plain.
- Detail pages (`app/capabilities/[slug]`) are NOT built: Next.js static export fails on a dynamic route with no routes. Add the template back when the first capability has real content and is marked ready, and make the Capabilities page pass an `href` for ready items in the same change.
- To add a photo: put it in `public/images/capabilities/<slug>.jpg` (resize first, phone photos are several MB), set `image`, set `ready: true` when the detail page has content.
- Order: On-Site Surveying, CAD Design, Laser Cutting, Punching, Folding, Rolling, Tube Bending, CNC Machining, Welding, Finishing, Powder Coating, Delivery.
- Copy is signed off by the developer. Use it word for word from `src/lib/capabilities.ts`. Laser Cutting, CNC Machining and Powder Coating copy was drafted from the old Partner Services paragraph with no specifics and approved on 2026-10-08. Do not mention "partner" in the tile copy (the developer will cover it on a detail page later). Finishing's block title was shortened to "Finishing" and its description names polishing, galvanisation and chemical oxidation.

## Planned: brochure download (Projects page)
- Form collects only an email address, with a REQUIRED consent checkbox. The brochure PDF is emailed to the visitor. The PDF does not exist yet, so build it so the file can be dropped in later.
- Needs an email-sending service and a Supabase Edge Function (sending cannot happen from a static site). Sending domain needs SPF and DKIM records in Cloudflare DNS. A domain can have only ONE SPF record, so it must be merged with Microsoft 365's (`include:spf.protection.outlook.com`).
- Consent wording must be decided (see open items). Marketing/mailing list consent should be a separate unticked box and the brochure must not depend on it.
- Cannot go live on the real domain until ICO registration is done and the Privacy Policy covers it.

## Design direction
- Rejected: dark, heavy industrial theme.
- Target: clean, premium, light, like a high-end engineering firm.
- Homepage hero: three photos, subtle motion (parallax or slow zoom, not heavy animation), three dots bottom right showing which photo is showing. Photos from Rob needed. A hero preview was built (`sls-hero-preview.html`) but did not render for the developer; decide again when real photos exist.
- Waiting for reference websites from the developer.

## Style and voice notes (explicit feedback from the developer)
- Accuracy first. Check facts or ask before adding details. Never invent specifics (materials, capacity, certifications, client names).
- Do not add content that wasn't asked for. Make small edits to existing copy, do not rewrite wholesale.
- Avoid em dashes in body copy (fine in headings). Avoid repeating phrases like "your project" across sections. Plain, concise tone. Must not read as AI-generated.
- Client company names must not be published without explicit permission.

## Legal and compliance status
- Privacy Policy, Terms of Use, Cookie Policy: drafted and live as pages, NOT legally reviewed, placeholders for dates and contact details still to fill in.
- Company is NOT yet registered with the ICO. This must be done before any live data collection (quote form, brochure, analytics) on the real domain.
- Analytics: undecided. The developer leans Google Analytics for now; Rachael to confirm. Google Analytics needs a consent banner before go-live (UK PECR). Plausible/Fathom were the alternatives (no cookie banner). Nothing is installed yet and nothing should be until go-live.

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

## Open items
- Rob: Microsoft admin login, ICO registration, mission statement, workshop photos, sector name wording, permission to name any clients, brochure PDF.
- Rachael: analytics decision (Google Analytics with banner, or Plausible). Asked 2026-10-08. Key deciding question put to her: is paid advertising (Google Ads) planned? Also proposed an optional "How did you hear about us?" field on the quote form (not yet agreed), plus Google Search Console and Google Business Profile.
- Rob: asked 2026-10-08 about recovering the company Facebook page.
- Build: brochure form, Projects page, About page, homepage, Turnstile spam protection, legal page fill-in and review, attach domain to Worker, retire the old Netlify site.
