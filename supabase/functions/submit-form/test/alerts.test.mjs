// Alert-email tests for submit-form, against the in-memory fake Supabase and a fake Microsoft Graph.
// Run from the project root:  node supabase/functions/submit-form/test/alerts.test.mjs
// No network and no real project: Turnstile and Graph are answered locally.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import { startFake } from "../../retention-cleanup/test/fake-supabase.mjs";
import { installFakeGraph, captureLogs } from "./fake-graph.mjs";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("npm:")) return next(specifier.slice(4).replace(/@[^@/]*$/, ""), context);
    return next(specifier, context);
  },
});

const graph = installFakeGraph();
const logs = captureLogs();
const print = (s) => process.stdout.write(s + "\n");

const env = {
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  TURNSTILE_SECRET_KEY: "test-turnstile",
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
assert.ok(handler, "submit-form registered a handler");

const state = { tables: {}, storage: { "quote-files": new Set(), "cv-files": new Set() }, failPaths: new Set(), requests: [] };
const fake = await startFake(state);
env.SUPABASE_URL = fake.url;

// Personal data used below; none of it may appear in any log line.
const PERSON = { name: "Jane Testperson", phone: "07700 900123", email: "jane.testperson@example.invalid", company: "Testco Fabrication Ltd", location: "Hailsham", need_by: "end of November", project_details: "Two stainless brackets,\nbrushed finish", submission_description: "Rev 2 drawings" };

async function submit(form, fields, files = []) {
  const res = await handler(new Request("http://local/functions/v1/submit-form", {
    method: "POST",
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ form, fields: { consent: true, ...fields }, files, turnstileToken: "token", website: "" }),
  }));
  return { status: res.status, body: await res.json() };
}
const quote = (extra = {}, files = []) => submit("quote", { ...PERSON, ...extra }, files);
const last = (table) => state.tables[table].at(-1);
const reset = () => { graph.mails.length = 0; graph.sendAttempts = 0; graph.failSend = false; graph.failToken = false; graph.sendDelayMs = 0; delete globalThis.EdgeRuntime; };

let passed = 0;
async function test(name, body) {
  reset();
  await body();
  passed++;
  print("ok - " + name);
}

await test("disabled (ALERTS_ENABLED unset): quote saved, nothing sent, attempts unchanged", async () => {
  delete env.ALERTS_ENABLED;
  const r = await quote();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { uploads: [] });
  assert.equal(graph.tokenCalls + graph.sendAttempts, 0);
  assert.equal(last("quote_requests").notified_at, null);
  assert.equal(last("quote_requests").notify_attempts, 0);
});

await test("ALERTS_ENABLED must be exactly \"true\" (\"TRUE\", \"1\", \"yes\" do nothing)", async () => {
  for (const v of ["TRUE", "1", "yes", " true"]) {
    env.ALERTS_ENABLED = v;
    await quote();
    assert.equal(graph.sendAttempts, 0, v);
    assert.equal(last("quote_requests").notify_attempts, 0, v);
  }
});

env.ALERTS_ENABLED = "true";

await test("enabled + success: plain-text email to ALERT_TO from ALERT_FROM, full details in form order, notified_at set", async () => {
  const r = await quote();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { uploads: [] }, "response unchanged");
  assert.equal(graph.mails.length, 1);
  const { url, method, auth, payload } = graph.mails[0];
  assert.equal(method, "POST");
  assert.equal(url, "https://graph.microsoft.com/v1.0/users/website-alerts%40example.invalid/sendMail");
  assert.equal(auth, "Bearer fake-graph-token");
  assert.equal(payload.saveToSentItems, false);
  assert.equal(payload.message.body.contentType, "Text");
  assert.deepEqual(payload.message.toRecipients, [{ emailAddress: { address: "info@example.invalid" } }]);
  assert.deepEqual(payload.message.replyTo, [{ emailAddress: { address: PERSON.email } }]);
  assert.equal(payload.message.subject, "Website quote request from Jane Testperson");
  const body = payload.message.body.content;
  const row = last("quote_requests");
  assert.match(body, /^New quote request from the website\.\n\nSubmitted: .+ \(UK time\)\nRequest ID: /);
  assert.ok(body.includes(`Request ID: ${row.id}`));
  const order = ["Name: Jane", "Company: Testco", "Location: Hailsham", "Phone: 07700", "Email: jane.", "Need by: end of", "Project details:\nTwo stainless brackets,\nbrushed finish", "Description: Rev 2"];
  let at = -1;
  for (const piece of order) { const i = body.indexOf(piece); assert.ok(i > at, `"${piece}" in order`); at = i; }
  assert.ok(!body.includes("Files"), "no files section without files");
  assert.ok(row.notified_at, "notified_at set");
  assert.equal(row.notify_attempts, 1);
  assert.equal(graph.lastTokenRequest.url, "https://login.microsoftonline.com/tenant-123/oauth2/v2.0/token");
  assert.match(graph.lastTokenRequest.body, /grant_type=client_credentials/);
  assert.match(graph.lastTokenRequest.body, /scope=https%3A%2F%2Fgraph\.microsoft\.com%2F\.default/);
  assert.ok(graph.signals.every(Boolean), "every Graph call has a timeout signal");
});

await test("empty optional fields are left out of the email", async () => {
  await quote({ company: "", location: "", need_by: "", project_details: "", submission_description: "" });
  const body = graph.mails[0].payload.message.body.content;
  for (const label of ["Company:", "Location:", "Need by:", "Project details:", "Description:"]) assert.ok(!body.includes(label), label);
  for (const label of ["Name:", "Phone:", "Email:"]) assert.ok(body.includes(label), label);
});

await test("Graph sendMail failure: submission still succeeds with the same response, notified_at stays null, attempt counted", async () => {
  graph.failSend = true;
  const r = await quote();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { uploads: [] });
  assert.equal(last("quote_requests").notified_at, null);
  assert.equal(last("quote_requests").notify_attempts, 1);
});

await test("Graph token failure: submission still succeeds, nothing sent, notified_at stays null", async () => {
  graph.failToken = true;
  const before = graph.tokenCalls;
  const r = await quote();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { uploads: [] });
  assert.equal(graph.tokenCalls, before + 1);
  assert.equal(graph.sendAttempts, 0);
  assert.equal(last("quote_requests").notified_at, null);
  assert.equal(last("quote_requests").notify_attempts, 1);
});

await test("database update failure after sending: response unchanged, nothing thrown", async () => {
  state.failPatch = (table) => table === "quote_requests";
  const r = await quote();
  delete state.failPatch;
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { uploads: [] });
  assert.equal(graph.mails.length, 1);
});

await test("quote WITH files is not sent from submit-form (files upload after the response); left for alert-sweep", async () => {
  const r = await quote({}, [{ name: "drawing.pdf", type: "application/pdf", size: 1000 }]);
  assert.equal(r.status, 200);
  assert.equal(r.body.uploads.length, 1);
  assert.equal(graph.sendAttempts, 0);
  assert.equal(last("quote_requests").notified_at, null);
  assert.equal(last("quote_requests").notify_attempts, 0);
});

await test("job application is not sent from submit-form (the CV uploads after the response); left for alert-sweep", async () => {
  const r = await submit("careers", { name: PERSON.name, email: PERSON.email }, [{ name: "cv.pdf", type: "application/pdf", size: 1000 }]);
  assert.equal(r.status, 200);
  assert.equal(graph.sendAttempts, 0);
  assert.equal(last("job_applications").notified_at, null);
  assert.equal(last("job_applications").notify_attempts, 0);
});

await test("brochure submissions are unaffected: no email, no alert columns", async () => {
  const r = await submit("brochure", { email: PERSON.email });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { uploads: [] });
  assert.equal(graph.sendAttempts, 0);
  const row = last("brochure_requests");
  assert.ok(!("notified_at" in row) && !("notify_attempts" in row));
});

await test("CR/LF in the name cannot inject headers: subject is one line", async () => {
  await quote({ name: "Mallory\r\nBcc: victim@example.invalid\nX-Evil: 1" });
  const subject = graph.mails[0].payload.message.subject;
  assert.ok(!/[\r\n]/.test(subject), JSON.stringify(subject));
  assert.equal(subject, "Website quote request from Mallory Bcc: victim@example.invalid X-Evil: 1");
  assert.deepEqual(Object.keys(graph.mails[0].payload.message).sort(), ["body", "replyTo", "subject", "toRecipients"]);
});

await test("a very long name is capped in the subject", async () => {
  await quote({ name: "N".repeat(190) });
  assert.ok(graph.mails[0].payload.message.subject.length <= 150);
});

await test("honeypot bot fake-success sends nothing", async () => {
  const res = await handler(new Request("http://local/functions/v1/submit-form", {
    method: "POST", headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ form: "quote", fields: { consent: true, ...PERSON }, files: [], turnstileToken: "token", website: "http://spam.example" }),
  }));
  assert.equal(res.status, 200);
  assert.equal(graph.sendAttempts, 0);
});

await test("with EdgeRuntime.waitUntil the response is returned before the email finishes sending", async () => {
  const pending = [];
  globalThis.EdgeRuntime = { waitUntil: (p) => pending.push(p) };
  graph.sendDelayMs = 300;
  const started = Date.now();
  const r = await quote();
  const took = Date.now() - started;
  assert.equal(r.status, 200);
  assert.equal(pending.length, 1, "send handed to waitUntil");
  assert.equal(graph.mails.length, 0, "not sent yet when the response came back");
  assert.ok(took < 300, `response took ${took}ms`);
  await Promise.all(pending);
  assert.equal(graph.mails.length, 1);
  assert.ok(last("quote_requests").notified_at);
});

await test("no personal data in any log line", async () => {
  const joined = logs.join("\n");
  assert.ok(logs.some((l) => l.startsWith("alert sent:")), "alert logs were captured");
  assert.ok(logs.some((l) => l.startsWith("alert failed:")), "failure logs were captured");
  for (const value of [PERSON.name, "Jane", PERSON.phone, PERSON.email, PERSON.company, "Testco", PERSON.need_by, "stainless", "Rev 2", "Mallory", "victim@", "drawing.pdf", "cv.pdf", "info@example.invalid", "website-alerts@", "graph-secret-123", "fake-graph-token"]) {
    assert.ok(!joined.includes(value), `log contains "${value}"`);
  }
});

fake.close();
print(`\n${passed} tests passed`);
