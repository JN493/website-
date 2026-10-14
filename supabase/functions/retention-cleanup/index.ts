// retention-cleanup: deletes personal data that is past its retention period.
// Paste this file into the Supabase dashboard (Edge Functions > retention-cleanup). Verify JWT: OFF.
// Called once a day by pg_cron (see supabase/retention-schedule.sql). Needs supabase/retention.sql first.
//
// Secrets (set in the dashboard, never in code):
//   RETENTION_CLEANUP_SECRET   - required; every call must send it in the x-retention-secret header
//   RETENTION_DELETE_ENABLED   - "true" to really delete; anything else (or unset) is a DRY RUN that only counts
//   RETENTION_KILL_SWITCH      - "on" stops every run immediately (logged, nothing read or deleted)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - provided automatically
//
// Each run has two phases:
//   1. PLAN: every lookup, paged so no batch limit can hide rows. If any lookup fails, the whole run stops
//      before anything is deleted, and the failure is logged.
//   2. DELETE: quote requests, brochure requests and job applications (files first, then the row),
//      then contacts last. A row whose file could not be deleted is kept and retried on the next run.
// The log (retention_log) holds counts only: no names, emails, file names or IDs.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// SETTINGS: retention periods (Rob's decisions) and safety limits. Change them here only.
// ---------------------------------------------------------------------------
export const RETENTION_MONTHS = {
  quote_requests: 12, // after the linked contact's last_seen_at (or the row's created_at if contact_id is null)
  brochure_requests: 12, // after sent_at (or created_at if the brochure was never sent)
  job_applications: 12, // after created_at (submission)
  contacts: 12, // after last_seen_at, and only once no quote or brochure request references the contact
};
export const MAX_DELETES_PER_TABLE_PER_RUN = 100;
// Rows read per lookup page. Kept small so "id in (...)" lists stay well within URL limits.
export const LOOKUP_PAGE_SIZE = 100;
// ---------------------------------------------------------------------------

type Db = SupabaseClient;
type Counts = { would_delete: number; deleted: number; failed: number; skipped: number; more_remaining: boolean };
const emptyCounts = (): Counts => ({ would_delete: 0, deleted: 0, failed: 0, skipped: 0, more_remaining: false });

class LookupFailed extends Error {
  step: string;
  code: string;
  constructor(step: string, code: string) {
    super(`lookup failed: ${step}`);
    this.step = step;
    this.code = code;
  }
}

function cutoff(now: Date, months: number) {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
}

// Constant-time comparison, so the secret cannot be guessed from response timing.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Runs a lookup; any error stops the whole run (no deletions happen during the plan phase).
async function lookup<T>(step: string, query: PromiseLike<{ data: T[] | null; error: { code?: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new LookupFailed(step, error.code ?? "unknown");
  return data ?? [];
}

// Keeps at most MAX rows and notes whether more were waiting.
function cap<T>(list: T[], counts: Counts) {
  counts.more_remaining = list.length > MAX_DELETES_PER_TABLE_PER_RUN;
  return list.slice(0, MAX_DELETES_PER_TABLE_PER_RUN);
}

// Deletes files through the Storage API (never via SQL, which would orphan them), then checks they are gone.
// A file that was already missing counts as success.
async function removeFiles(db: Db, bucket: string, paths: string[]) {
  if (paths.length === 0) return true;
  const { error } = await db.storage.from(bucket).remove(paths);
  if (error) return false;
  for (const path of paths) {
    const slash = path.lastIndexOf("/");
    const folder = slash === -1 ? "" : path.slice(0, slash);
    const name = path.slice(slash + 1);
    const { data, error: listError } = await db.storage.from(bucket).list(folder, { search: name });
    if (listError || (data ?? []).some((f) => f.name === name)) return false;
  }
  return true;
}

// Files first, then the row. If the files cannot be removed, the row stays for the next run.
// Rows that could not be deleted are recorded in `failed` as "table:id".
async function deleteRows<T extends { id: unknown }>(
  db: Db, table: string, bucket: string | null, list: T[], filesOf: (row: T) => string[],
  dryRun: boolean, counts: Counts, failed: Set<string>,
) {
  for (const row of list) {
    counts.would_delete++;
    if (dryRun) continue;
    if (bucket && !(await removeFiles(db, bucket, filesOf(row)))) {
      counts.failed++;
      failed.add(`${table}:${row.id}`);
      continue;
    }
    const { error } = await db.from(table).delete().eq("id", row.id);
    if (error) {
      counts.failed++;
      failed.add(`${table}:${row.id}`);
    } else counts.deleted++;
  }
}

export async function runRetention(db: Db, dryRun: boolean, now = new Date()) {
  const counts = {
    quote_requests: emptyCounts(),
    brochure_requests: emptyCounts(),
    job_applications: emptyCounts(),
    contacts: emptyCounts(),
  };
  const page = (from: number) => [from, from + LOOKUP_PAGE_SIZE - 1] as const;

  // ---------------------------------------------------------------- PLAN (reads only)

  // Quote requests.
  type Quote = { id: unknown; file_paths: string[] | null; contact_id: string | null };
  const quoteCutoff = cutoff(now, RETENTION_MONTHS.quote_requests);
  // contact_id genuinely null: the row's own created_at decides.
  let quotes = await lookup<Quote>("quotes without contact", db.from("quote_requests")
    .select("id,file_paths,contact_id").is("contact_id", null).lt("created_at", quoteCutoff)
    .order("created_at").order("id").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1));
  // contact_id set: the contact's last_seen_at decides, looked up page by page.
  // A contact is always seen at or after its requests are created, so only quotes older than the cutoff can qualify.
  // A quote whose contact is not returned by the lookup is SKIPPED (kept), never treated as having no contact.
  for (let from = 0; quotes.length <= MAX_DELETES_PER_TABLE_PER_RUN; from += LOOKUP_PAGE_SIZE) {
    const batch = await lookup<Quote>("quotes with contact", db.from("quote_requests")
      .select("id,file_paths,contact_id").not("contact_id", "is", null).lt("created_at", quoteCutoff)
      .order("created_at").order("id").range(...page(from)));
    if (batch.length === 0) break;
    const contactIds = [...new Set(batch.map((q) => q.contact_id as string))];
    const lastSeen = new Map((await lookup<{ id: string; last_seen_at: string | null }>("contacts for quotes",
      db.from("contacts").select("id,last_seen_at").in("id", contactIds))).map((c) => [c.id, c.last_seen_at]));
    for (const q of batch) {
      if (!lastSeen.has(q.contact_id as string)) {
        counts.quote_requests.skipped++;
        continue;
      }
      const seen = lastSeen.get(q.contact_id as string);
      if (seen && Date.parse(seen) < Date.parse(quoteCutoff)) quotes.push(q);
    }
    if (batch.length < LOOKUP_PAGE_SIZE) break;
  }
  quotes = cap(quotes, counts.quote_requests);

  // Brochure requests: sent_at past the cutoff, or never sent and created_at past it (the contact plays no part).
  type Brochure = { id: unknown };
  const brochureCutoff = cutoff(now, RETENTION_MONTHS.brochure_requests);
  let brochures = await lookup<Brochure>("brochures sent", db.from("brochure_requests").select("id")
    .lt("sent_at", brochureCutoff).order("sent_at").order("id").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1));
  brochures = brochures.concat(await lookup<Brochure>("brochures never sent", db.from("brochure_requests").select("id")
    .is("sent_at", null).lt("created_at", brochureCutoff).order("created_at").order("id").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1)));
  brochures = cap(brochures, counts.brochure_requests);

  // Job applications: created_at past the cutoff. CV in cv-files.
  type Job = { id: unknown; file_path: string | null };
  const jobCutoff = cutoff(now, RETENTION_MONTHS.job_applications);
  const jobs = cap(await lookup<Job>("job applications", db.from("job_applications").select("id,file_path")
    .lt("created_at", jobCutoff).order("created_at").order("id").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1)), counts.job_applications);

  // Contacts: last_seen_at past the cutoff AND no request still references them, other than requests
  // this run is about to delete. Paged, so every stale contact is considered.
  // The foreign keys have no ON DELETE action, so a contact that is still referenced can never be deleted.
  const planned = new Set([
    ...quotes.map((q) => `quote_requests:${q.id}`),
    ...brochures.map((b) => `brochure_requests:${b.id}`),
  ]);
  const contactCutoff = cutoff(now, RETENTION_MONTHS.contacts);
  let contacts: { id: string; dependsOn: string[] }[] = [];
  for (let from = 0; contacts.length <= MAX_DELETES_PER_TABLE_PER_RUN; from += LOOKUP_PAGE_SIZE) {
    const batch = await lookup<{ id: string }>("stale contacts", db.from("contacts").select("id")
      .lt("last_seen_at", contactCutoff).order("last_seen_at").order("id").range(...page(from)));
    if (batch.length === 0) break;
    const ids = batch.map((c) => c.id);
    const dependsOn = new Map<string, string[]>();
    const stillUsed = new Set<string>();
    for (const table of ["quote_requests", "brochure_requests"]) {
      const refs = await lookup<{ id: unknown; contact_id: string }>(`${table} referencing contacts`,
        db.from(table).select("id,contact_id").in("contact_id", ids));
      for (const r of refs) {
        const key = `${table}:${r.id}`;
        if (planned.has(key)) dependsOn.set(r.contact_id, [...(dependsOn.get(r.contact_id) ?? []), key]);
        else stillUsed.add(r.contact_id);
      }
    }
    for (const id of ids) if (!stillUsed.has(id)) contacts.push({ id, dependsOn: dependsOn.get(id) ?? [] });
    if (batch.length < LOOKUP_PAGE_SIZE) break;
  }
  contacts = cap(contacts, counts.contacts);

  // ---------------------------------------------------------------- DELETE

  const failed = new Set<string>();
  await deleteRows(db, "quote_requests", "quote-files", quotes, (q) => q.file_paths ?? [], dryRun, counts.quote_requests, failed);
  await deleteRows(db, "brochure_requests", null, brochures, () => [], dryRun, counts.brochure_requests, failed);
  await deleteRows(db, "job_applications", "cv-files", jobs, (j) => (j.file_path ? [j.file_path] : []), dryRun, counts.job_applications, failed);

  // Contacts last. A contact whose planned request could not be deleted is skipped (still referenced).
  const deletable = contacts.filter((c) => {
    if (c.dependsOn.some((key) => failed.has(key))) {
      counts.contacts.skipped++;
      return false;
    }
    return true;
  });
  await deleteRows(db, "contacts", null, deletable, () => [], dryRun, counts.contacts, failed);

  return counts;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Not allowed" }, 405);
  const secret = Deno.env.get("RETENTION_CLEANUP_SECRET");
  if (!secret || !safeEqual(req.headers.get("x-retention-secret") ?? "", secret)) return json({ error: "Unauthorized" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const dryRun = Deno.env.get("RETENTION_DELETE_ENABLED") !== "true";

  try {
    if (Deno.env.get("RETENTION_KILL_SWITCH") === "on") {
      await db.from("retention_log").insert({ dry_run: dryRun, killed: true, counts: {} });
      return json({ killed: true }, 200);
    }
    const counts = await runRetention(db, dryRun);
    const { error } = await db.from("retention_log").insert({ dry_run: dryRun, killed: false, counts });
    if (error) throw error;
    return json({ dry_run: dryRun, counts }, 200);
  } catch (err) {
    // Step name and error code only: database messages can quote row values.
    const reason = err instanceof LookupFailed
      ? `lookup failed: ${err.step} (${err.code})`
      : `error (${(err as { code?: string } | null)?.code ?? "unknown"})`;
    console.error("retention-cleanup stopped:", reason);
    await db.from("retention_log").insert({ dry_run: dryRun, killed: false, counts: {}, error: reason });
    return json({ error: "Something went wrong.", stopped: true }, 500);
  }
});
