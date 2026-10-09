// submit-form: the only way the website's three forms save data.
// Paste this file into the Supabase dashboard (Edge Functions > submit-form).
//
// Secrets (set in the dashboard, never in code):
//   TURNSTILE_SECRET_KEY        - Cloudflare Turnstile secret
//   SUPABASE_URL                - provided automatically
//   SUPABASE_SERVICE_ROLE_KEY   - provided automatically
//
// Flow: check origin -> honeypot -> verify Turnstile -> validate fields, files and source
// -> create signed upload URLs -> (quote/brochure) find-or-create the contact by email
// -> insert the row -> return the upload URLs.
//
// Needs supabase/add-source-and-contacts.sql to have been run first (source columns,
// contacts table, contact_id columns and the upsert_contact function).
//
// Known limitation: the row is saved before the browser uploads the files,
// so a failed upload can leave a row whose file_paths point at missing files.

import { createClient } from "npm:@supabase/supabase-js@2";

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
  },
  brochure: { email: [true, 200] },
  careers: { name: [true, 200], email: [true, 200] },
};

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
  const row: Record<string, string> = {};
  for (const [key, [required, maxLength]] of Object.entries(FIELDS[form])) {
    const value = typeof input[key] === "string" ? (input[key] as string).trim() : "";
    if (required && !value) throw new Rejected(`${key} required`);
    if (value.length > maxLength) throw new Rejected(`${key} too long`);
    row[key] = value; // optional fields are stored as "" (quote_requests.company is NOT NULL)
  }
  if (!EMAIL_RE.test(row.email)) throw new Rejected("email invalid");
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

    const { error } = await supabase.from(TABLES[form]).insert(row);
    if (error) throw error;

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
