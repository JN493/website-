// alert-sweep: sends the alert emails that submit-form did not send.
// Paste this file into the Supabase dashboard (Edge Functions > alert-sweep). Verify JWT: OFF.
// Called every 15 minutes by supabase/alerts-schedule.sql (pg_cron + pg_net).
//
// Secrets (set in the dashboard, never in code):
//   ALERT_SWEEP_SECRET          - required; every call must send it in the x-alert-secret header
//   ALERTS_ENABLED              - nothing is sent (and no attempt is counted) unless this is exactly "true"
//   GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, ALERT_FROM, ALERT_TO - Microsoft Graph (see CLAUDE.md)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - provided automatically
//
// Picks up quote requests and job applications with notified_at null, fewer than 5 attempts and
// created more than 2 minutes ago (so the browser has finished uploading any files), newest first,
// at most 20 per run. Each try increments notify_attempts; success sets notified_at.
// Returns counts only. Needs supabase/alerts.sql to have been run first.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const MAX_PER_RUN = 20;
const MAX_ATTEMPTS = 5;
const MIN_AGE_MS = 2 * 60 * 1000;
// Stop starting new emails after this long, so a slow run (10s timeouts) ends well inside the
// Edge Function time limit; anything left over is picked up by the next run.
const TIME_BUDGET_MS = 100_000;

// ===== ALERT CODE START =====
// Identical copy in supabase/functions/submit-form/index.ts and supabase/functions/alert-sweep/index.ts:
// each function is pasted into the dashboard on its own, so they cannot share an import.
// A test checks both copies match, so change them together.
//
// Emails ALERT_TO (info@) about a saved quote request or job application, through Microsoft Graph
// (client credentials flow, fetch only). Does nothing unless ALERTS_ENABLED is exactly "true".
// Plain text only. Logs record ids, statuses and counts, never personal data.

type AlertKind = "quote" | "careers";
type AlertRow = Record<string, unknown> & { id: string; created_at: string; notify_attempts?: number };

const ALERT_TABLES: Record<AlertKind, string> = { quote: "quote_requests", careers: "job_applications" };
const ALERT_BUCKETS: Record<AlertKind, string> = { quote: "quote-files", careers: "cv-files" };
// Fields in the form's order: [column, label]. Empty fields are left out of the email.
const ALERT_FIELDS: Record<AlertKind, [string, string][]> = {
  quote: [
    ["name", "Name"],
    ["company", "Company"],
    ["location", "Location"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["need_by", "Need by"],
    ["project_details", "Project details"],
    ["submission_description", "Description"],
  ],
  careers: [
    ["name", "Name"],
    ["email", "Email"],
  ],
};
const ALERT_LINK_SECONDS = 1209600; // file links last 14 days
const ALERT_TIMEOUT_MS = 10000;
const ALERT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AlertError extends Error {} // messages are safe to log: no personal data

function alertsEnabled() {
  return Deno.env.get("ALERTS_ENABLED") === "true";
}

function alertEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new AlertError(`missing ${name}`);
  return value;
}

// One line, no control characters (so CR/LF can never reach a header), capped.
function oneLine(value: string, max: number) {
  return value.replace(/[\u0000-\u001f\u007f\p{Zl}\p{Zp}]+/gu, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function ukTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", dateStyle: "full", timeStyle: "short" }).format(date) + " (UK time)";
}

function alertFetch(url: string, init: RequestInit) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ALERT_TIMEOUT_MS) });
}

let graphToken: { value: string; expires: number } | null = null;
async function getGraphToken() {
  if (graphToken && graphToken.expires > Date.now() + 60_000) return graphToken.value;
  const tenant = encodeURIComponent(alertEnv("GRAPH_TENANT_ID"));
  const res = await alertFetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    body: new URLSearchParams({
      client_id: alertEnv("GRAPH_CLIENT_ID"),
      client_secret: alertEnv("GRAPH_CLIENT_SECRET"),
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new AlertError(`token request failed (${res.status})`);
  const data = await res.json().catch(() => null);
  if (typeof data?.access_token !== "string") throw new AlertError("token missing from response");
  graphToken = { value: data.access_token, expires: Date.now() + (Number(data.expires_in) || 3000) * 1000 };
  return graphToken.value;
}

async function buildAlert(db: SupabaseClient, kind: AlertKind, row: AlertRow) {
  const what = kind === "quote" ? "quote request" : "job application";
  const subject = oneLine(`Website ${what} from ${oneLine(String(row.name ?? ""), 100) || "unknown"}`, 150);
  const lines = [`New ${what} from the website.`, "", `Submitted: ${ukTime(new Date(row.created_at))}`, `Request ID: ${row.id}`, ""];
  for (const [key, label] of ALERT_FIELDS[kind]) {
    const value = typeof row[key] === "string" ? (row[key] as string).trim() : "";
    if (value) lines.push(value.includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`);
  }

  const paths = kind === "quote"
    ? (Array.isArray(row.file_paths) ? (row.file_paths as unknown[]).filter((p): p is string => typeof p === "string") : [])
    : (typeof row.file_path === "string" ? [row.file_path] : []);
  if (paths.length) {
    // Links are made at send time. A file that never uploaded gets a note instead of failing the alert.
    const { data, error } = await db.storage.from(ALERT_BUCKETS[kind]).createSignedUrls(paths, ALERT_LINK_SECONDS);
    if (error || !data) throw new AlertError("signed links failed");
    lines.push("", `Files (links expire ${ukTime(new Date(Date.now() + ALERT_LINK_SECONDS * 1000))}):`);
    for (const path of paths) {
      const link = data.find((d) => d.path === path);
      lines.push(`- ${path.slice(path.lastIndexOf("/") + 1)}`);
      lines.push(`  ${link && !link.error && link.signedUrl ? link.signedUrl : "(link unavailable: the file may not have uploaded)"}`);
    }
  }

  const email = typeof row.email === "string" ? row.email.trim() : "";
  return { subject, body: lines.join("\n"), replyTo: ALERT_EMAIL_RE.test(email) ? email : null };
}

async function sendAlertEmail(alert: { subject: string; body: string; replyTo: string | null }) {
  const from = alertEnv("ALERT_FROM");
  const to = alertEnv("ALERT_TO");
  const token = await getGraphToken();
  const message: Record<string, unknown> = {
    subject: alert.subject,
    body: { contentType: "Text", content: alert.body },
    toRecipients: [{ emailAddress: { address: to } }],
  };
  if (alert.replyTo) message.replyTo = [{ emailAddress: { address: alert.replyTo } }];
  const res = await alertFetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message, saveToSentItems: false }),
  });
  if (res.status !== 202) throw new AlertError(`sendMail failed (${res.status})`);
}

// Sends one alert and records the attempt. Never throws. "disabled" means nothing was sent or recorded.
async function notifyRow(db: SupabaseClient, kind: AlertKind, row: AlertRow): Promise<"sent" | "failed" | "disabled"> {
  if (!alertsEnabled()) return "disabled";
  const table = ALERT_TABLES[kind];
  const attempts = (Number(row.notify_attempts) || 0) + 1;
  try {
    await sendAlertEmail(await buildAlert(db, kind, row));
  } catch (err) {
    const reason = err instanceof AlertError ? err.message : ((err as Error | null)?.name ?? "error");
    console.error(`alert failed: ${kind} ${row.id} attempt ${attempts}: ${reason}`);
    try {
      await db.from(table).update({ notify_attempts: attempts }).eq("id", row.id);
    } catch {
      console.error(`alert attempt not recorded: ${kind} ${row.id}`);
    }
    return "failed";
  }
  try {
    const { error } = await db.from(table).update({ notified_at: new Date().toISOString(), notify_attempts: attempts }).eq("id", row.id);
    if (error) console.error(`alert sent but not recorded: ${kind} ${row.id} (${error.code ?? "db error"})`);
  } catch {
    console.error(`alert sent but not recorded: ${kind} ${row.id}`);
  }
  console.log(`alert sent: ${kind} ${row.id}`);
  return "sent";
}
// ===== ALERT CODE END =====

// Constant-time comparison, so the secret cannot be guessed from response timing.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("ALERT_SWEEP_SECRET");
  if (!secret || !safeEqual(req.headers.get("x-alert-secret") ?? "", secret)) return json({ error: "Unauthorized" }, 401);

  // Off: send nothing, count nothing, do not even look at the tables.
  if (!alertsEnabled()) return json({ enabled: false, due: 0, sent: 0, failed: 0, left_for_next_run: 0 }, 200);

  const started = Date.now();
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const cutoff = new Date(Date.now() - MIN_AGE_MS).toISOString();

  const due: { kind: AlertKind; row: AlertRow }[] = [];
  for (const kind of ["quote", "careers"] as AlertKind[]) {
    const { data, error } = await db
      .from(ALERT_TABLES[kind])
      .select("*")
      .is("notified_at", null)
      .lt("notify_attempts", MAX_ATTEMPTS)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(MAX_PER_RUN);
    if (error) {
      console.error(`alert sweep lookup failed: ${kind} (${error.code ?? "db error"})`);
      return json({ error: "lookup failed" }, 500);
    }
    for (const row of (data ?? []) as AlertRow[]) due.push({ kind, row });
  }

  // Newest first across both tables, at most MAX_PER_RUN per run.
  due.sort((a, b) => Date.parse(b.row.created_at) - Date.parse(a.row.created_at));
  const counts = { enabled: true, due: due.length, sent: 0, failed: 0, left_for_next_run: 0 };
  for (const [i, { kind, row }] of due.entries()) {
    if (i >= MAX_PER_RUN || Date.now() - started > TIME_BUDGET_MS) {
      counts.left_for_next_run++;
      continue;
    }
    const result = await notifyRow(db, kind, row);
    if (result === "sent") counts.sent++;
    else if (result === "failed") counts.failed++;
  }
  console.log(`alert sweep: ${JSON.stringify(counts)}`);
  return json(counts, 200);
});
