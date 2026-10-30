# SLS Fabrications website

The company website for SLS Fabrications, a welding and steel fabrication workshop in Hailsham, East Sussex.

Built with Next.js (App Router) and Tailwind CSS as a static export, hosted on Cloudflare Workers. The forms submit through Supabase Edge Functions (in `supabase/`).

**`CLAUDE.md` is the source of truth** for how the site is built, hosted and run, the decisions made, and what is still open. Read it before making changes.

## Run and build

```bash
npm install
npm run dev     # local development server
npm run lint
npm run build   # static export to out/
```

The build reads its public settings from environment variables (see `CLAUDE.md`, "Backend: Supabase"). Locally they go in `.env.local`, which is git-ignored.

## Secrets

Secrets are never committed. Server-side keys and secrets live only in the Supabase function secrets (and Vault where noted) and a password manager, never in this repository.
