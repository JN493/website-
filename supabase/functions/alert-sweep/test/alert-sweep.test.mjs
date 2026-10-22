// Tests for the alert-sweep Edge Function, against the in-memory fake Supabase and a fake Microsoft Graph.
// Run from the project root:  node supabase/functions/alert-sweep/test/alert-sweep.test.mjs
// No network and no real project.
import assert from "node:assert/strict";
import fs from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import { startFake } from "../../retention-cleanup/test/fake-supabase.mjs";
import { installFakeGraph, captureLogs } from "../../submit-form/test/fake-graph.mjs";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("npm:")) return next(specifier.slice(4).replace(/@[^@/]*$/, ""), context);
    return next(specifier, context);
  },
});

const graph = installFakeGraph();
const logs = captureLogs();
const print = (s) => process.stdout.write(s + "\n");

const SECRET = "sweep-secret-123";
const env = {
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  ALERT_SWEEP_SECRET: SECRET,
  GRAPH_TENANT_ID: "tenant-123",
  GRAPH_CLIENT_ID: "client-123",
  GRAPH_CLIENT_SECRET: "graph-secret-123",
  ALERT_FROM: "website-alerts@example.invalid",
  ALERT_TO: "info@example.invalid",
};
let handler;
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };

const here = path.dirname(fileURLToPath(import.meta.url));
await import(pathToFileURL(path.join(here, "..", "index.ts")).href);
assert.ok(handler, "alert-sweep registered a handler");

let state;
let fake;
const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
function freshState() {
  state = { tables: { quote_requests: [], job_applications: [], brochure_requests: [] }, storage: { "quote-files": new Set(), "cv-files": new Set() }, failPaths: new Set(), requests: [] };
  return state;
}
const quoteRow = (id, extra = {}) => ({ id, created_at: minutesAgo(10), notified_at: null, notify_attempts: 0, name: "Jane Testperson", company: "Testco Fabrication Ltd", location: "Hailsham", phone: "07700 900123", email: "jane.testperson@example.invalid", need_by: "", project_details: "Brackets", submission_description: "", file_paths: [], ...extra });
const appRow = (id, extra = {}) => ({ id, created_at: minutesAgo(10), notified_at: null, notify_attempts: 0, name: "Sam Applicant", email: "sam.applicant@example.invalid", file_path: `f-${id}/Sam_CV.pdf`, ...extra });

async function sweep(headers = { "x-alert-secret": SECRET }) {
  const res = await handler(new Request("http://local/functions/v1/alert-sweep", { method: "POST", headers }));
  return { status: res.status, body: await res.json() };
}

let passed = 0;
async function test(name, body) {
  graph.mails.length = 0; graph.sendAttempts = 0; graph.failSend = false; graph.failToken = false;
  freshState();
  fake = await startFake(state);
  env.SUPABASE_URL = fake.url;
  try { await body(); } finally { fake.close(); }
  passed++;
  print("ok - " + name);
}

await test("missing or wrong x-alert-secret: 401 and nothing happens", async () => {
  env.ALERTS_ENABLED = "true";
  state.tables.quote_requests.push(quoteRow("q1"));
  for (const headers of [{}, { "x-alert-secret": "wrong" }, { "x-alert-secret": SECRET + "x" }]) {
    const r = await sweep(headers);
    assert.equal(r.status, 401);
  }
  assert.equal(graph.sendAttempts, 0);
  assert.equal(state.requests.length, 0, "database not touched");
});

await test("disabled: nothing sent, attempts unchanged, tables not even read", async () => {
  delete env.ALERTS_ENABLED;
  state.tables.quote_requests.push(quoteRow("q1"));
  state.tables.job_applications.push(appRow("j1"));
  const r = await sweep();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { enabled: false, due: 0, sent: 0, failed: 0, left_for_next_run: 0 });
  assert.equal(graph.tokenCalls + graph.sendAttempts, 0);
  assert.equal(state.tables.quote_requests[0].notify_attempts, 0);
  assert.equal(state.tables.job_applications[0].notify_attempts, 0);
  assert.equal(state.requests.length, 0);
  env.ALERTS_ENABLED = "true";
});

await test("quote with files: sent with 14-day signed links (1209600 s) and the expiry date; notified_at set", async () => {
  state.tables.quote_requests.push(quoteRow("q1", { file_paths: ["f-q1/drawing.pdf", "f-q1/photo.jpg"] }));
  state.storage["quote-files"].add("f-q1/drawing.pdf").add("f-q1/photo.jpg");
  const r = await sweep();
  assert.deepEqual(r.body, { enabled: true, due: 1, sent: 1, failed: 0, left_for_next_run: 0 });
  assert.equal(state.signRequests.length, 1);
  assert.equal(state.signRequests[0].expiresIn, 1209600);
  assert.equal(state.signRequests[0].bucket, "quote-files");
  const body = graph.mails[0].payload.message.body.content;
  const expiry = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", dateStyle: "full", timeStyle: "short" }).format(new Date(Date.now() + 1209600 * 1000));
  assert.ok(body.includes(`Files (links expire ${expiry} (UK time)):`), body);
  assert.ok(body.includes("- drawing.pdf\n  http://") && body.includes("token=signed-1209600"));
  assert.ok(body.includes("- photo.jpg\n  http://"));
  assert.equal(graph.mails[0].payload.message.subject, "Website quote request from Jane Testperson");
  assert.ok(state.tables.quote_requests[0].notified_at);
  assert.equal(state.tables.quote_requests[0].notify_attempts, 1);
});

await test("job application: subject, name + email only, CV link from cv-files", async () => {
  state.tables.job_applications.push(appRow("j1"));
  state.storage["cv-files"].add("f-j1/Sam_CV.pdf");
  const r = await sweep();
  assert.equal(r.body.sent, 1);
  const { message } = graph.mails[0].payload;
  assert.equal(message.subject, "Website job application from Sam Applicant");
  assert.match(message.body.content, /^New job application from the website\./);
  assert.ok(message.body.content.includes("Name: Sam Applicant\nEmail: sam.applicant@example.invalid"));
  assert.ok(message.body.content.includes("- Sam_CV.pdf\n  http://"));
  assert.equal(state.signRequests[0].bucket, "cv-files");
  assert.deepEqual(message.replyTo, [{ emailAddress: { address: "sam.applicant@example.invalid" } }]);
  assert.ok(state.tables.job_applications[0].notified_at);
});

await test("a file that never uploaded: alert still sent, with a note instead of a link", async () => {
  state.tables.quote_requests.push(quoteRow("q1", { file_paths: ["f-q1/missing.pdf"] }));
  const r = await sweep();
  assert.equal(r.body.sent, 1);
  assert.ok(graph.mails[0].payload.message.body.content.includes("- missing.pdf\n  (link unavailable: the file may not have uploaded)"));
});

await test("Graph failure: retried on each run, stops after 5 attempts, notified_at stays null", async () => {
  graph.failSend = true;
  state.tables.quote_requests.push(quoteRow("q1"));
  for (let run = 1; run <= 7; run++) {
    const r = await sweep();
    assert.equal(r.status, 200);
    assert.equal(r.body.failed, run <= 5 ? 1 : 0, `run ${run}`);
  }
  assert.equal(graph.sendAttempts, 5);
  assert.equal(state.tables.quote_requests[0].notify_attempts, 5);
  assert.equal(state.tables.quote_requests[0].notified_at, null);
});

await test("a later success after failures sets notified_at and stops further sends", async () => {
  graph.failSend = true;
  state.tables.quote_requests.push(quoteRow("q1"));
  await sweep(); await sweep();
  graph.failSend = false;
  const r = await sweep();
  assert.equal(r.body.sent, 1);
  assert.equal(state.tables.quote_requests[0].notify_attempts, 3);
  assert.ok(state.tables.quote_requests[0].notified_at);
  assert.equal((await sweep()).body.due, 0);
});

await test("backfilled rows (notified_at already set) are never sent", async () => {
  const old = minutesAgo(60 * 24 * 300);
  state.tables.quote_requests.push(quoteRow("q-old", { created_at: old, notified_at: old }));
  state.tables.job_applications.push(appRow("j-old", { created_at: old, notified_at: old }));
  const r = await sweep();
  assert.deepEqual(r.body, { enabled: true, due: 0, sent: 0, failed: 0, left_for_next_run: 0 });
  assert.equal(graph.sendAttempts, 0);
});

await test("rows under 2 minutes old are left alone (their files may still be uploading)", async () => {
  state.tables.quote_requests.push(quoteRow("q-new", { created_at: minutesAgo(1) }));
  state.tables.quote_requests.push(quoteRow("q-ready", { created_at: minutesAgo(3) }));
  const r = await sweep();
  assert.equal(r.body.due, 1);
  assert.equal(state.tables.quote_requests.find((q) => q.id === "q-new").notify_attempts, 0);
  assert.ok(state.tables.quote_requests.find((q) => q.id === "q-ready").notified_at);
});

await test("invalid email in the row: no Reply-To at all", async () => {
  for (const [i, email] of ["not-an-email", "two@@example.invalid", "a b@example.invalid", "x@y.z\r\nBcc: v@example.invalid", ""].entries()) {
    state.tables.quote_requests.push(quoteRow(`q${i}`, { email, created_at: minutesAgo(10 + i) }));
  }
  const r = await sweep();
  assert.equal(r.body.sent, 5);
  for (const m of graph.mails) assert.ok(!("replyTo" in m.payload.message), JSON.stringify(m.payload.message.replyTo));
});

await test("CR/LF in a stored name cannot inject headers", async () => {
  state.tables.job_applications.push(appRow("j1", { name: "Eve\r\nBcc: victim@example.invalid", file_path: null }));
  await sweep();
  const subject = graph.mails[0].payload.message.subject;
  assert.ok(!/[\r\n]/.test(subject));
  assert.equal(subject, "Website job application from Eve Bcc: victim@example.invalid");
});

await test("at most 20 per run, newest first; the rest are left for the next run", async () => {
  for (let i = 0; i < 15; i++) state.tables.quote_requests.push(quoteRow(`q${String(i).padStart(2, "0")}`, { created_at: minutesAgo(10 + i * 2) }));
  for (let i = 0; i < 10; i++) state.tables.job_applications.push(appRow(`j${String(i).padStart(2, "0")}`, { created_at: minutesAgo(11 + i * 2), file_path: null }));
  const r = await sweep();
  assert.equal(r.body.sent, 20);
  assert.equal(r.body.left_for_next_run, r.body.due - 20);
  const sentIds = graph.mails.map((m) => m.payload.message.body.content.match(/Request ID: (\S+)/)[1]);
  const all = [...state.tables.quote_requests, ...state.tables.job_applications].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  assert.deepEqual(sentIds, all.slice(0, 20).map((r) => r.id), "newest first");
  const next = await sweep();
  assert.equal(next.body.sent, 5);
});

await test("brochure requests are never read or emailed", async () => {
  state.tables.brochure_requests.push({ id: "b1", email: "b@example.invalid", created_at: minutesAgo(30) });
  await sweep();
  assert.ok(!state.requests.some((r) => r.includes("brochure_requests")));
  assert.equal(graph.sendAttempts, 0);
});

await test("the alert code is identical in submit-form and alert-sweep", async () => {
  const pick = (fn) => {
    const s = fs.readFileSync(path.join(here, "..", "..", fn, "index.ts"), "utf8").replace(/\r\n/g, "\n");
    const start = s.indexOf("// ===== ALERT CODE START =====");
    const end = s.indexOf("// ===== ALERT CODE END =====");
    assert.ok(start >= 0 && end > start, `${fn} has the markers`);
    return s.slice(start, end);
  };
  assert.equal(pick("submit-form"), pick("alert-sweep"));
});

await test("no personal data in any log line", async () => {
  const joined = logs.join("\n");
  assert.ok(logs.some((l) => l.startsWith("alert sweep:")), "sweep logs were captured");
  assert.ok(logs.some((l) => l.startsWith("alert failed:")), "failure logs were captured");
  for (const value of ["Jane", "Testperson", "07700", "jane.testperson@", "Testco", "Hailsham", "Brackets", "Sam Applicant", "sam.applicant@", "Sam_CV", "drawing.pdf", "photo.jpg", "missing.pdf", "victim@", "Eve", "info@example.invalid", "website-alerts@", "graph-secret-123", SECRET, "fake-graph-token", "token=signed"]) {
    assert.ok(!joined.includes(value), `log contains "${value}"`);
  }
});

print(`\n${passed} tests passed`);
