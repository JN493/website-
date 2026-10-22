// submit-form: the only way the website's three forms save data.
// Paste this file into the Supabase dashboard (Edge Functions > submit-form).
//
// Secrets (set in the dashboard, never in code):
//   TURNSTILE_SECRET_KEY        - Cloudflare Turnstile secret
//   SUPABASE_URL                - provided automatically
//   SUPABASE_SERVICE_ROLE_KEY   - provided automatically
//   ALERTS_ENABLED              - alert emails are sent only when this is exactly "true"
//   GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, ALERT_FROM, ALERT_TO - Microsoft Graph (see CLAUDE.md)
//
// Flow: check origin -> honeypot -> verify Turnstile -> validate fields, files and source
// -> create signed upload URLs -> (quote/brochure) find-or-create the contact by email
// -> insert the row -> (quote without files) send the alert email -> return the upload URLs.
//
// Needs supabase/add-source-and-contacts.sql to have been run first (source columns,
// contacts table, contact_id columns and the upsert_contact function), and supabase/quote-fields.sql
// (need_by and location columns on quote_requests), and supabase/alerts.sql (notified_at, notify_attempts).
//
// Known limitation: the row is saved before the browser uploads the files,
// so a failed upload can leave a row whose file_paths point at missing files.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://slsfabrications.com",
  "https://www.slsfabrications.com",
  "https://website.robstonesls77.workers.dev",
  "http://localhost:3000",
];

const MB = 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Text fields per form: name -> [required, max length]. Anything else sent is ignored.
const FIELDS: Record<string, Record<string, [boolean, number]>> = {
  quote: {
    name: [true, 200],
    company: [false, 200],
    phone: [true, 50],
    email: [true, 200],
    project_details: [false, 5000],
    submission_description: [false, 1000],
    need_by: [false, 100],
    location: [false, 100],
  },
  brochure: { email: [true, 200] },
  careers: { name: [true, 200], email: [true, 200] },
};

// Optional fields stored as null when empty (nullable columns). Other optional fields are stored as "".
const NULL_WHEN_EMPTY = new Set(["need_by", "location"]);

const TABLES: Record<string, string> = {
  quote: "quote_requests",
  brochure: "brochure_requests",
  careers: "job_applications",
};

const CV_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// File rules per form. Quote: optional, any type, 20 MB each (the quote-files bucket limit).
const FILE_RULES: Record<string, { bucket: string; min: number; max: number; maxBytes: number; cvOnly: boolean } | null> = {
  quote: { bucket: "quote-files", min: 0, max: 10, maxBytes: 20 * MB, cvOnly: false },
  brochure: null,
  careers: { bucket: "cv-files", min: 1, max: 1, maxBytes: 5 * MB, cvOnly: true },
};

// Where the visitor came from (quote and brochure only). Optional: bad values are dropped, never rejected.
const SOURCE_KEYS = [
  "landing_page",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "submitted_from",
];

type FileInfo = { name: string; type: string; size: number };

class Rejected extends Error {}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

async function verifyTurnstile(token: string, ip: string | null) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) throw new Error("TURNSTILE_SECRET_KEY is not set");
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = await res.json();
  return result.success === true;
}

function cleanFields(form: string, raw: unknown) {
  if (typeof raw !== "object" || raw === null) throw new Rejected("fields missing");
  const input = raw as Record<string, unknown>;
  const row: Record<string, string | null> = {};
  for (const [key, [required, maxLength]] of Object.entries(FIELDS[form])) {
    const value = typeof input[key] === "string" ? (input[key] as string).trim() : "";
    if (required && !value) throw new Rejected(`${key} required`);
    if (value.length > maxLength) throw new Rejected(`${key} too long`);
    row[key] = value || (NULL_WHEN_EMPTY.has(key) ? null : ""); // other optional fields are stored as "" (quote_requests.company is NOT NULL)
  }
  if (!EMAIL_RE.test(row.email ?? "")) throw new Rejected("email invalid");
  if (input.consent !== true) throw new Rejected("consent missing");
  return row;
}

function cleanFiles(form: string, raw: unknown): FileInfo[] {
  const rules = FILE_RULES[form];
  const files = Array.isArray(raw) ? raw : [];
  if (!rules) {
    if (files.length) throw new Rejected("files not allowed");
    return [];
  }
  if (files.length < rules.min || files.length > rules.max) throw new Rejected("wrong file count");
  return files.map((f) => {
    const name = typeof f?.name === "string" ? f.name : "";
    const size = typeof f?.size === "number" ? f.size : -1;
    const type = typeof f?.type === "string" ? f.type : "";
    if (!name || size <= 0 || size > rules.maxBytes) throw new Rejected("file size");
    if (rules.cvOnly && !CV_TYPES[name.split(".").pop()?.toLowerCase() ?? ""]) throw new Rejected("file type");
    return { name, size, type };
  });
}

// Keeps only known keys whose values are non-empty strings of up to 200 characters after trimming.
// The referrer is reduced to hostname plus path (no query string or hash).
function cleanSource(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof raw !== "object" || raw === null) return out;
  const input = raw as Record<string, unknown>;
  for (const key of SOURCE_KEYS) {
    if (typeof input[key] !== "string") continue;
    let value = (input[key] as string).trim();
    if (key === "referrer" && value) {
      try {
        const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? new URL(value) : new URL(`https://${value}`);
        value = url.hostname + url.pathname;
      } catch {
        continue;
      }
    }
    if (value && value.length <= 200) out[key] = value;
  }
  return out;
}

// ===== ALERT CODE START =====
// Identical copy in supabase/functions/submit-form/index.ts and supabase/functions/alert-sweep/index.ts:
// each function is pasted into the dashboard on its own, so they cannot share an import.
// A test checks both copies match, so change them together.
//
// Emails ALERT_TO (info@) about a saved quote request or job application, through Microsoft Graph
// (client credentials flow, fetch only). Does nothing unless ALERTS_ENABLED is exactly "true".
// Plain text only. Logs record ids, statuses and counts, never personal data.
// If a listed file is not in storage yet, the alert waits (no send, no attempt counted) until the row
// is ALERT_FILE_WAIT_MS old, then goes out saying the file did not arrive.

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
const ALERT_FILE_WAIT_MS = 30 * 60 * 1000; // a missing file is waited for until the row is 30 minutes old
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

  let missing = 0;
  const paths = kind === "quote"
    ? (Array.isArray(row.file_paths) ? (row.file_paths as unknown[]).filter((p): p is string => typeof p === "string") : [])
    : (typeof row.file_path === "string" ? [row.file_path] : []);
  if (paths.length) {
    // Links are made at send time. A file that is not in storage counts as missing (see notifyRow).
    const { data, error } = await db.storage.from(ALERT_BUCKETS[kind]).createSignedUrls(paths, ALERT_LINK_SECONDS);
    if (error || !data) throw new AlertError("signed links failed");
    lines.push("", `Files (links expire ${ukTime(new Date(Date.now() + ALERT_LINK_SECONDS * 1000))}):`);
    for (const path of paths) {
      const link = data.find((d) => d.path === path);
      const url = link && !link.error && link.signedUrl ? link.signedUrl : null;
      if (!url) missing++;
      lines.push(`- ${path.slice(path.lastIndexOf("/") + 1)}`);
      lines.push(`  ${url ?? "(file did not arrive: the upload may have failed)"}`);
    }
  }

  const email = typeof row.email === "string" ? row.email.trim() : "";
  return { subject, body: lines.join("\n"), replyTo: ALERT_EMAIL_RE.test(email) ? email : null, missing };
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

// Sends one alert and records the attempt. Never throws. "disabled" and "waiting" (a file is not in storage yet
// and the row is under ALERT_FILE_WAIT_MS old) mean nothing was sent and no attempt was recorded.
async function notifyRow(db: SupabaseClient, kind: AlertKind, row: AlertRow): Promise<"sent" | "failed" | "disabled" | "waiting"> {
  if (!alertsEnabled()) return "disabled";
  const table = ALERT_TABLES[kind];
  const attempts = (Number(row.notify_attempts) || 0) + 1;
  try {
    const alert = await buildAlert(db, kind, row);
    if (alert.missing && Date.now() - Date.parse(row.created_at) < ALERT_FILE_WAIT_MS) return "waiting";
    await sendAlertEmail(alert);
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

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: "Not allowed" }, 403, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Not allowed" }, 405, origin);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new Rejected("bad body");
    const form = body.form;
    if (form !== "quote" && form !== "brochure" && form !== "careers") throw new Rejected("unknown form");

    // Honeypot filled: pretend it worked, save nothing.
    if (typeof body.website === "string" && body.website.trim() !== "") return json({ uploads: [] }, 200, origin);

    if (typeof body.turnstileToken !== "string" || !body.turnstileToken) throw new Rejected("no token");
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    if (!(await verifyTurnstile(body.turnstileToken, ip))) throw new Rejected("turnstile failed");

    const row: Record<string, unknown> = cleanFields(form, body.fields);
    const files = cleanFiles(form, body.files);
    const source = form === "careers" ? {} : cleanSource(body.source); // careers never stores source

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Signed upload URLs first, so a storage failure saves no row.
    const uploads: { bucket: string; path: string; token: string; contentType: string }[] = [];
    const rules = FILE_RULES[form];
    if (rules && files.length) {
      const folder = crypto.randomUUID();
      const used = new Set<string>();
      for (const [i, file] of files.entries()) {
        let safeName = file.name.replace(/[^\w.-]/g, "_").slice(-100);
        if (used.has(safeName)) safeName = `${i}_${safeName}`; // same name twice in one quote
        used.add(safeName);
        const path = `${folder}/${safeName}`;
        const { data, error } = await supabase.storage.from(rules.bucket).createSignedUploadUrl(path);
        if (error || !data) throw error ?? new Error("no signed url");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const contentType = rules.cvOnly ? CV_TYPES[ext] : file.type || "application/octet-stream";
        uploads.push({ bucket: rules.bucket, path: data.path, token: data.token, contentType });
      }
    }

    // One contact per email across quote and brochure requests; a repeat is a new row on the same contact.
    // If this fails, nothing is inserted, so a lead is never half-saved. Job applicants are not contacts.
    if (form === "quote" || form === "brochure") {
      const { data: contactId, error: contactError } = await supabase.rpc("upsert_contact", {
        p_email: row.email,
        p_name: row.name ?? null,
        p_phone: row.phone ?? null,
        p_company: row.company ?? null,
      });
      if (contactError || !contactId) throw contactError ?? new Error("no contact id");
      row.contact_id = contactId;
    }

    if (form === "quote") row.file_paths = uploads.map((u) => u.path);
    if (form === "careers") row.file_path = uploads[0].path;
    Object.assign(row, source);
    row.consent_given_at = new Date().toISOString();

    // The saved row comes back (id, created_at, notify_attempts) for the alert email.
    const { data: saved, error } = await supabase.from(TABLES[form]).insert(row).select("*").single();
    if (error || !saved) throw error ?? new Error("no row returned");

    // Alert email. Only quote requests without files are sent from here: the browser uploads files after
    // this response, so quotes with files and job applications (always a CV) are sent by alert-sweep once
    // the upload has had time to finish. notifyRow never throws, so the visitor's response is unaffected,
    // and waitUntil lets the response go first where the runtime supports it.
    if (form === "quote" && uploads.length === 0) {
      const task = notifyRow(supabase, "quote", saved as AlertRow);
      const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
      if (runtime?.waitUntil) runtime.waitUntil(task);
      else await task;
    }

    return json({ uploads }, 200, origin);
  } catch (err) {
    if (err instanceof Rejected) {
      console.warn("submit-form rejected:", err.message);
      return json({ error: "Your submission could not be accepted." }, 400, origin);
    }
    // Supabase database errors are plain objects, not Error instances. Neither includes secrets.
    console.error("submit-form failed:", (err as { message?: string } | null)?.message ?? "unknown error");
    return json({ error: "Something went wrong." }, 500, origin);
  }
});
