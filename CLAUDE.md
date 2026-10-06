# SLS Fabrications Website — Project Context

## About the business
SLS Fabrications is a welding and steel fabrication workshop based in Hailsham, East Sussex, UK.
- Address: Unit 2 Diplocks Way, Hailsham, East Sussex
- Phone: 01323 846061
- Hours: Mon–Fri, 7:30am–5:00pm
- Small team (5–15 people)

## Project goal
Building the company website (and eventually an internal workshop efficiency app) using Next.js, hosted on Netlify, domain managed via Netlify DNS (slsfabrications.com).

## Site structure (final, agreed)
Five pages: **About, Capabilities, Industries, Projects, Contact** — no "Our" prefix, deliberately dropped for being repetitive.

- **About** — team, workshop photo, mission statement (pending from Rob, the owner)
- **Capabilities** — the 8 core services (content finalized, see below), plus partner services and delivery
- **Industries** — 12 confirmed real sectors worked in (direct or subcontracted); do NOT name specific client companies without explicit sign-off — defence/security sector needs extra care
- **Projects** — case studies (pending photos), brochure download (collects email for mailing list), "Request a Quote" flow entry point, careers link
- **Contact** — houses both CTAs: "Request a Quote" (for people with drawings/specifics) and "Talk to the Team" (general enquiries); the Projects page quote flow funnels into this page

## Design direction
- **Rejected**: dark/heavy industrial theme (too dark, didn't fit)
- **Target feel**: clean, premium — like a high-end engineering firm, not corporate-generic, not harsh/industrial-dark
- Still waiting on reference website links from the user to nail down specifics
- Homepage hero: a 3-photo scroll/rotation, kept subtle (parallax or slow pan), not heavy animation

## Finalized content: Capabilities page
Order matters — Welding is first and most important.

1. **Welding** — "Skilled welding across a range of materials, built to the standard your project and your industry demand. This is the core of what we do, and every other capability supports it."
2. **Folding** — "Precision folding to shape steel into the exact profiles your project requires, from structural components to detailed brackets. This is one of our strongest capabilities."
3. **Rolling** — "Precision rolling for projects that need curved or cylindrical steel sections."
4. **On-Site Surveying** — "We are available to assess your site in person before work begins, to ensure accuracy and reduce costly surprises later in the project." (worded as optional/available, not a required step)
5. **CAD Design** — "Your project could start with our precise digital design, letting us plan, adjust, and confirm specifications with you before a single piece of steel is cut." (also optional, not every project needs it)
6. **Punching** — wide range of hole types/sizes, general wording, no specifics
7. **Tube Bending** — precise angles, no loss of structural integrity
8. **Finishing** — polishing, galvanisation, chemical oxidation
9. **Partner Services** — laser cutting, CNC machining, powder coating (via trusted partners)
10. **Delivery** — national and international

## Style/voice notes (important — user has given explicit feedback on this)
- Avoid overusing em dashes in body copy (fine in headings only, e.g. "Finishing — Polishing, Galvanisation & Chemical Oxidation")
- Avoid repeating the same phrase (e.g. "your project") across multiple consecutive sections
- Don't write overly declarative/salesy sentences — match the user's own plainer tone
- Content should not read as AI-generated — clear and concise over flowery

## Legal / compliance status
- Privacy Policy, Terms of Use, Cookie Policy — drafted, live as real pages, NOT legally reviewed yet
- Company is NOT YET registered with the ICO (UK data protection regulator) — this must happen before any live data collection (quote forms, brochure email capture, analytics) goes fully live
- Analytics tool not yet chosen — comparing Google Analytics (free, needs cookie banner) vs. Plausible (small monthly cost, no cookie banner needed) — leaning Plausible
- Client company names should NOT be published without explicit permission, especially for subcontracted work

## Other business context (not yet actioned)
- Company has an existing Microsoft 365 subscription (login details not yet obtained) — to be used for business email (e.g. info@slsfabrications.com) and general file sharing
- Domain: slsfabrications.com is primary (live), slsfabrications.co.uk is purchased but currently unconnected/parked
- Tech stack decided: Next.js (App Router) + Tailwind CSS, hosted on Netlify, future app features planned to use Supabase (Postgres) for backend/auth/database when the internal workshop app phase begins

## Known past issue (resolved)
Project previously had duplicate `app` folders (`src/app/` and root `app/`) causing broken routing — all pages now correctly live under the root `app/` folder. `src/components/` (Nav.tsx, Footer.tsx) is correctly structured and imported via `@/components/...`.
