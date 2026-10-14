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
// Order per run: quote requests, brochure requests and job applications (files first, then the row),
// then contacts last. A row whose file could not be deleted is kept and retried on the next run.
// The log (retention_log) holds counts only: no names, emails, file names or IDs.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// SETTINGS: retention periods (Rob's decisions) and safety limits. Change them here only.
// ---------------------------------------------------------------------------
export const RETENTION_MONTHS = {
  quote_requests: 12, // after the linked contact's last_seen_at (or the row's created_at if it has no contact)
  brochure_requests: 12, // after sent_at (or created_at if the brochure was never sent)
  job_applications: 12, // after created_at (submission)
  contacts: 12, // after last_seen_at, and only once no quote or brochure request references the contact
};
export const MAX_DELETES_PER_TABLE_PER_RUN = 100;
// ponytail: contacts are looked up in one batch of this size; raise it or page through if the table grows past it
const CONTACT_LOOKUP_LIMIT = 1000;
// ---------------------------------------------------------------------------

type Db = SupabaseClient;
type Counts = { would_delete: number; deleted: number; failed: number; more_remaining: boolean };
const emptyCounts = (): Counts => ({ would_delete: 0, deleted: 0, failed: 0, more_remaining: false });

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

async function rows<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw error;
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
async function deleteRows<T extends { id: unknown }>(
  db: Db, table: string, bucket: string | null, list: T[], filesOf: (row: T) => string[], dryRun: boolean, counts: Counts,
) {
  for (const row of list) {
    counts.would_delete++;
    if (dryRun) continue;
    if (bucket && !(await removeFiles(db, bucket, filesOf(row)))) {
      counts.failed++;
      continue;
    }
    const { error } = await db.from(table).delete().eq("id", row.id);
    if (error) counts.failed++;
    else counts.deleted++;
  }
}

export async function runRetention(db: Db, dryRun: boolean, now = new Date()) {
  const counts = {
    quote_requests: emptyCounts(),
    brochure_requests: emptyCounts(),
    job_applications: emptyCounts(),
    contacts: emptyCounts(),
  };

  // Quote requests: contact's last_seen_at past the cutoff, or no contact and created_at past it.
  type Quote = { id: unknown; file_paths: string[] | null };
  const quoteCutoff = cutoff(now, RETENTION_MONTHS.quote_requests);
  const staleContactIds = (await rows<{ id: string }>(
    db.from("contacts").select("id").lt("last_seen_at", quoteCutoff).limit(CONTACT_LOOKUP_LIMIT),
  )).map((c) => c.id);
  let quotes = await rows<Quote>(
    db.from("quote_requests").select("id,file_paths").is("contact_id", null).lt("created_at", quoteCutoff)
      .order("created_at").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1),
  );
  if (staleContactIds.length) {
    quotes = quotes.concat(await rows<Quote>(
      db.from("quote_requests").select("id,file_paths").in("contact_id", staleContactIds)
        .order("created_at").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1),
    ));
  }
  quotes = cap(quotes, counts.quote_requests);
  await deleteRows(db, "quote_requests", "quote-files", quotes, (q) => q.file_paths ?? [], dryRun, counts.quote_requests);

  // Brochure requests: sent_at past the cutoff, or never sent and created_at past it.
  type Brochure = { id: unknown };
  const brochureCutoff = cutoff(now, RETENTION_MONTHS.brochure_requests);
  let brochures = await rows<Brochure>(
    db.from("brochure_requests").select("id").lt("sent_at", brochureCutoff).order("sent_at").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1),
  );
  brochures = brochures.concat(await rows<Brochure>(
    db.from("brochure_requests").select("id").is("sent_at", null).lt("created_at", brochureCutoff)
      .order("created_at").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1),
  ));
  brochures = cap(brochures, counts.brochure_requests);
  await deleteRows(db, "brochure_requests", null, brochures, () => [], dryRun, counts.brochure_requests);

  // Job applications: created_at past the cutoff. CV in cv-files.
  type Job = { id: unknown; file_path: string | null };
  const jobCutoff = cutoff(now, RETENTION_MONTHS.job_applications);
  const jobs = cap(await rows<Job>(
    db.from("job_applications").select("id,file_path").lt("created_at", jobCutoff).order("created_at").limit(MAX_DELETES_PER_TABLE_PER_RUN + 1),
  ), counts.job_applications);
  await deleteRows(db, "job_applications", "cv-files", jobs, (j) => (j.file_path ? [j.file_path] : []), dryRun, counts.job_applications);

  // Contacts last: last_seen_at past the cutoff AND no quote or brochure request still references them.
  // In a dry run, rows that this run would have deleted are treated as gone, so the count matches a real run.
  // The foreign keys have no ON DELETE action, so a contact that is still referenced can never be deleted.
  const contactCutoff = cutoff(now, RETENTION_MONTHS.contacts);
  const candidates = (await rows<{ id: string }>(
    db.from("contacts").select("id").lt("last_seen_at", contactCutoff).order("last_seen_at").limit(CONTACT_LOOKUP_LIMIT),
  )).map((c) => c.id);
  if (candidates.length) {
    const goneInDryRun = new Set(dryRun
      ? [...quotes.map((r) => `quote_requests:${r.id}`), ...brochures.map((r) => `brochure_requests:${r.id}`)]
      : []);
    const referenced = new Set<string>();
    for (const table of ["quote_requests", "brochure_requests"]) {
      const refs = await rows<{ id: unknown; contact_id: string }>(
        db.from(table).select("id,contact_id").in("contact_id", candidates),
      );
      for (const r of refs) if (!goneInDryRun.has(`${table}:${r.id}`)) referenced.add(r.contact_id);
    }
    const free = cap(candidates.filter((id) => !referenced.has(id)).map((id) => ({ id })), counts.contacts);
    await deleteRows(db, "contacts", null, free, () => [], dryRun, counts.contacts);
  }

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
    // Error codes only: database messages can quote row values.
    console.error("retention-cleanup failed:", (err as { code?: string } | null)?.code ?? "unknown");
    return json({ error: "Something went wrong." }, 500);
  }
});
