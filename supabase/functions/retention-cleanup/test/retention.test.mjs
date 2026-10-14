// Tests for the retention-cleanup Edge Function, run against an in-memory fake Supabase.
// Run from the project root:  node supabase/functions/retention-cleanup/test/retention.test.mjs
// Uses Node's built-in TypeScript stripping and maps the function's "npm:" import to node_modules.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import { startFake } from "./fake-supabase.mjs";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("npm:")) return next(specifier.slice(4).replace(/@[^@/]*$/, ""), context);
    return next(specifier, context);
  },
});

// Minimal Deno stand-in: env from a plain object, Deno.serve captures the handler.
const env = {};
let handler;
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };

const here = path.dirname(fileURLToPath(import.meta.url));
const fn = await import(pathToFileURL(path.join(here, "..", "index.ts")).href);
assert.ok(handler, "function registered a handler");

const SECRET = "test-secret-123";
const monthsAgo = (m, extraDays = 0) => { const d = new Date(); d.setUTCMonth(d.getUTCMonth() - m); d.setUTCDate(d.getUTCDate() - extraDays); return d.toISOString(); };
const OLD = monthsAgo(13);
const NEW = monthsAgo(1);

function seed() {
  return {
    tables: {
      contacts: [
        { id: "c1", email: "old-quote@example.com", last_seen_at: OLD }, // only linked to old quote q1 -> deleted after q1
        { id: "c2", email: "recent@example.com", last_seen_at: NEW }, // old quote q2 but recent brochure b2 -> kept
        { id: "c3", email: "orphan@example.com", last_seen_at: OLD }, // no linked rows -> deleted
        { id: "c4", email: "still-linked@example.com", last_seen_at: OLD }, // linked to recently sent brochure b4 -> kept
        { id: "c5", email: "old-brochure@example.com", last_seen_at: OLD }, // only linked to old brochure b7 -> deleted after b7
      ],
      quote_requests: [
        { id: "q1", contact_id: "c1", created_at: OLD, file_paths: ["f-q1/drawing.pdf", "f-q1/photo.jpg"], email: "old-quote@example.com" },
        { id: "q2", contact_id: "c2", created_at: OLD, file_paths: ["f-q2/a.pdf"], email: "recent@example.com" },
        { id: "q5", contact_id: null, created_at: OLD, file_paths: [], email: "nocontact-old@example.com" },
        { id: "q6", contact_id: null, created_at: NEW, file_paths: ["f-q6/b.pdf"], email: "nocontact-new@example.com" },
        { id: "q7", contact_id: null, created_at: OLD, file_paths: ["f-q7/fails.pdf"], email: "failing@example.com" },
      ],
      brochure_requests: [
        { id: "b2", contact_id: "c2", created_at: NEW, sent_at: NEW, email: "recent@example.com" },
        { id: "b4", contact_id: "c4", created_at: OLD, sent_at: NEW, email: "still-linked@example.com" },
        { id: "b7", contact_id: "c5", created_at: monthsAgo(14), sent_at: OLD, email: "old-brochure@example.com" },
        { id: "b8", contact_id: null, created_at: OLD, sent_at: null, email: "unsent-old@example.com" },
        { id: "b9", contact_id: null, created_at: NEW, sent_at: null, email: "unsent-new@example.com" },
      ],
      job_applications: [
        { id: "j1", created_at: OLD, file_path: "f-j1/cv.pdf", email: "old-applicant@example.com" },
        { id: "j2", created_at: NEW, file_path: "f-j2/cv.pdf", email: "new-applicant@example.com" },
        { id: "j3", created_at: OLD, file_path: "f-j3/missing.pdf", email: "missing-file@example.com" },
        { id: "j4", created_at: OLD, file_path: "f-j4/fails.pdf", email: "failing-cv@example.com" },
      ],
      retention_log: [],
    },
    storage: {
      "quote-files": new Set(["f-q1/drawing.pdf", "f-q1/photo.jpg", "f-q2/a.pdf", "f-q6/b.pdf", "f-q7/fails.pdf"]),
      "cv-files": new Set(["f-j1/cv.pdf", "f-j2/cv.pdf", "f-j4/fails.pdf"]), // f-j3/missing.pdf is already gone
    },
    failPaths: new Set(["f-q7/fails.pdf", "f-j4/fails.pdf"]),
    requests: [],
  };
}

const ids = (state, table) => state.tables[table].map((r) => r.id).sort();
const files = (state, bucket) => [...state.storage[bucket]].sort();
async function call(headers = { "x-retention-secret": SECRET }, method = "POST") {
  const res = await handler(new Request("http://local/functions/v1/retention-cleanup", { method, headers }));
  return { status: res.status, body: await res.json() };
}
const pick = (c) => ({ would_delete: c.would_delete, deleted: c.deleted, failed: c.failed, more_remaining: c.more_remaining });

let passed = 0;
async function test(name, body) {
  await body();
  passed++;
  console.log(`  ok  ${name}`);
}

// ---------------------------------------------------------------------------------------------
const state = seed();
const fake = await startFake(state);
Object.assign(env, { SUPABASE_URL: fake.url, SUPABASE_SERVICE_ROLE_KEY: "fake-service-role", RETENTION_CLEANUP_SECRET: SECRET });
const snapshot = () => JSON.stringify({ t: ["contacts", "quote_requests", "brochure_requests", "job_applications"].map((t) => ids(state, t)), q: files(state, "quote-files"), c: files(state, "cv-files") });

console.log("retention-cleanup tests");

await test("settings: 12 months everywhere, cap 100", () => {
  assert.deepEqual(fn.RETENTION_MONTHS, { quote_requests: 12, brochure_requests: 12, job_applications: 12, contacts: 12 });
  assert.equal(fn.MAX_DELETES_PER_TABLE_PER_RUN, 100);
});

await test("calls without the secret, with a wrong secret, or not POST are rejected and change nothing", async () => {
  const before = snapshot();
  assert.equal((await call({})).status, 401);
  assert.equal((await call({ "x-retention-secret": "wrong" })).status, 401);
  assert.equal((await call({ "x-retention-secret": SECRET + "x" })).status, 401);
  assert.equal((await call({ "x-retention-secret": SECRET }, "GET")).status, 405);
  assert.equal(snapshot(), before);
  assert.equal(state.tables.retention_log.length, 0);
  assert.equal(state.requests.length, 0, "rejected calls never reach the database");
});

await test("DRY RUN is the default: counts what it would delete, deletes nothing, logs counts", async () => {
  const before = snapshot();
  const { status, body } = await call();
  assert.equal(status, 200);
  assert.equal(body.dry_run, true);
  assert.deepEqual(pick(body.counts.quote_requests), { would_delete: 3, deleted: 0, failed: 0, more_remaining: false }); // q1 q5 q7
  assert.deepEqual(pick(body.counts.brochure_requests), { would_delete: 2, deleted: 0, failed: 0, more_remaining: false }); // b7 b8
  assert.deepEqual(pick(body.counts.job_applications), { would_delete: 3, deleted: 0, failed: 0, more_remaining: false }); // j1 j3 j4
  assert.deepEqual(pick(body.counts.contacts), { would_delete: 3, deleted: 0, failed: 0, more_remaining: false }); // c1 c3 c5
  assert.equal(snapshot(), before, "nothing changed");
  assert.ok(!state.requests.some((r) => r.startsWith("DELETE")), "no DELETE requests in a dry run");
  const log = state.tables.retention_log.at(-1);
  assert.equal(log.dry_run, true);
  assert.equal(log.killed, false);
  assert.deepEqual(log.counts, body.counts);
});

await test("the log holds counts only: no emails, names, file names or record IDs", () => {
  const text = JSON.stringify(state.tables.retention_log);
  assert.ok(!text.includes("@"), "no emails");
  for (const t of ["contacts", "quote_requests", "brochure_requests", "job_applications"]) {
    for (const r of state.tables[t]) assert.ok(!text.includes(`"${r.id}"`), `no id ${r.id}`);
  }
  assert.ok(!/f-[qj]\d|\.pdf|\.jpg/.test(text), "no file names");
  assert.deepEqual(Object.keys(state.tables.retention_log[0]).sort(), ["counts", "dry_run", "id", "killed", "run_at"]);
});

await test("kill switch stops a real run before anything is read or deleted", async () => {
  env.RETENTION_DELETE_ENABLED = "true";
  env.RETENTION_KILL_SWITCH = "on";
  const before = snapshot();
  state.requests.length = 0;
  const { status, body } = await call();
  assert.equal(status, 200);
  assert.equal(body.killed, true);
  assert.equal(snapshot(), before);
  assert.deepEqual(state.requests, ["POST /rest/v1/retention_log"], "only the log entry is written");
  assert.equal(state.tables.retention_log.at(-1).killed, true);
  delete env.RETENTION_KILL_SWITCH;
});

await test("REAL run deletes exactly the expected rows and files, contacts last", async () => {
  state.requests.length = 0;
  const { status, body } = await call();
  assert.equal(status, 200);
  assert.equal(body.dry_run, false);
  assert.deepEqual(pick(body.counts.quote_requests), { would_delete: 3, deleted: 2, failed: 1, more_remaining: false });
  assert.deepEqual(pick(body.counts.brochure_requests), { would_delete: 2, deleted: 2, failed: 0, more_remaining: false });
  assert.deepEqual(pick(body.counts.job_applications), { would_delete: 3, deleted: 2, failed: 1, more_remaining: false });
  assert.deepEqual(pick(body.counts.contacts), { would_delete: 3, deleted: 3, failed: 0, more_remaining: false });

  assert.deepEqual(ids(state, "quote_requests"), ["q2", "q6", "q7"]); // q1 (old contact) and q5 (no contact, old) gone; q7 kept: file delete failed
  assert.deepEqual(ids(state, "brochure_requests"), ["b2", "b4", "b9"]); // b7 (sent long ago) and b8 (never sent, old) gone
  assert.deepEqual(ids(state, "job_applications"), ["j2", "j4"]); // j1 gone with CV, j3 gone (file already missing), j4 kept: CV delete failed
  assert.deepEqual(ids(state, "contacts"), ["c2", "c4"]); // c1, c3, c5 gone; c2 recent; c4 still linked to b4

  assert.deepEqual(files(state, "quote-files"), ["f-q2/a.pdf", "f-q6/b.pdf", "f-q7/fails.pdf"]);
  assert.deepEqual(files(state, "cv-files"), ["f-j2/cv.pdf", "f-j4/fails.pdf"]);

  // Order: no contact deleted before the last request-row deletion.
  const firstContactDelete = state.requests.indexOf("DELETE /rest/v1/contacts");
  const lastRowDelete = Math.max(...["quote_requests", "brochure_requests", "job_applications"].map((t) => state.requests.lastIndexOf(`DELETE /rest/v1/${t}`)));
  assert.ok(firstContactDelete > lastRowDelete, "contacts are deleted last");
  // Files before rows, per row: q1's files are removed before q1 is deleted; j1's CV before j1.
  const full = state.fullRequests;
  const at = (s) => full.findIndex((r) => r.includes(s));
  assert.ok(at("DELETE /storage/v1/object/quote-files f-q1/drawing.pdf,f-q1/photo.jpg") < at("DELETE /rest/v1/quote_requests?id=eq.q1"));
  assert.ok(at("DELETE /storage/v1/object/cv-files f-j1/cv.pdf") < at("DELETE /rest/v1/job_applications?id=eq.j1"));
  // The failing rows were never deleted.
  assert.equal(at("DELETE /rest/v1/quote_requests?id=eq.q7"), -1);
  assert.equal(at("DELETE /rest/v1/job_applications?id=eq.j4"), -1);
  assert.equal(state.tables.retention_log.at(-1).dry_run, false);
});

await test("running again is safe: nothing new deleted, failed rows retried and still kept", async () => {
  const before = snapshot();
  const { status, body } = await call();
  assert.equal(status, 200);
  assert.deepEqual(pick(body.counts.quote_requests), { would_delete: 1, deleted: 0, failed: 1, more_remaining: false }); // q7 retried
  assert.deepEqual(pick(body.counts.brochure_requests), { would_delete: 0, deleted: 0, failed: 0, more_remaining: false });
  assert.deepEqual(pick(body.counts.job_applications), { would_delete: 1, deleted: 0, failed: 1, more_remaining: false }); // j4 retried
  assert.deepEqual(pick(body.counts.contacts), { would_delete: 0, deleted: 0, failed: 0, more_remaining: false });
  assert.equal(snapshot(), before);
});

await test("once the failing file can be deleted, the next run removes the row and its file", async () => {
  state.failPaths.clear();
  const { body } = await call();
  assert.equal(body.counts.quote_requests.deleted, 1);
  assert.equal(body.counts.job_applications.deleted, 1);
  assert.deepEqual(ids(state, "quote_requests"), ["q2", "q6"]);
  assert.deepEqual(ids(state, "job_applications"), ["j2"]);
  assert.deepEqual(files(state, "quote-files"), ["f-q2/a.pdf", "f-q6/b.pdf"]);
  assert.deepEqual(files(state, "cv-files"), ["f-j2/cv.pdf"]);
});

await test("a contact still referenced is never deleted, even if asked directly (foreign key)", async () => {
  // c4 is old and linked to b4; the fake refuses the delete like the real ON DELETE NO ACTION key.
  const res = await fetch(`${fake.url}/rest/v1/contacts?id=eq.c4`, { method: "DELETE" });
  assert.equal(res.status, 409);
  assert.ok(ids(state, "contacts").includes("c4"));
});
fake.close();

await test("cap: at most 100 rows per table per run, the rest on the next run", async () => {
  const big = seed();
  big.tables = { contacts: [], quote_requests: [], brochure_requests: [], retention_log: [], job_applications: [] };
  big.storage = { "quote-files": new Set(), "cv-files": new Set() };
  big.failPaths = new Set();
  for (let i = 0; i < 105; i++) {
    big.tables.job_applications.push({ id: `j${i}`, created_at: monthsAgo(13, i), file_path: `f-${i}/cv.pdf` });
    big.storage["cv-files"].add(`f-${i}/cv.pdf`);
  }
  const fake2 = await startFake(big);
  env.SUPABASE_URL = fake2.url;
  const first = (await call()).body.counts.job_applications;
  assert.deepEqual(pick(first), { would_delete: 100, deleted: 100, failed: 0, more_remaining: true });
  assert.equal(big.tables.job_applications.length, 5);
  assert.equal(big.storage["cv-files"].size, 5);
  const second = (await call()).body.counts.job_applications;
  assert.deepEqual(pick(second), { would_delete: 5, deleted: 5, failed: 0, more_remaining: false });
  assert.equal(big.tables.job_applications.length, 0);
  fake2.close();
});

console.log(`\n${passed} tests passed`);
