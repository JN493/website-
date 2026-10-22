// Tests for the submit-form Edge Function, run against the in-memory fake Supabase (no network, no real project).
// Run from the project root:  node supabase/functions/submit-form/test/submit-form.test.mjs
// Uses Node's built-in TypeScript stripping and maps the function's "npm:" import to node_modules.
// Turnstile's siteverify call is answered locally with success.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import { startFake } from "../../retention-cleanup/test/fake-supabase.mjs";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("npm:")) return next(specifier.slice(4).replace(/@[^@/]*$/, ""), context);
    return next(specifier, context);
  },
});

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("https://challenges.cloudflare.com/turnstile/v0/siteverify")) return Promise.resolve(Response.json({ success: true }));
  return realFetch(input, init);
};

const env = { SUPABASE_SERVICE_ROLE_KEY: "test-service-role", TURNSTILE_SECRET_KEY: "test-turnstile" };
let handler;
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };

const here = path.dirname(fileURLToPath(import.meta.url));
await import(pathToFileURL(path.join(here, "..", "index.ts")).href);
assert.ok(handler, "function registered a handler");

const state = { tables: {}, storage: {}, failPaths: new Set(), requests: [] };
const fake = await startFake(state);
env.SUPABASE_URL = fake.url;

async function submit(form, fields, files = []) {
  const res = await handler(new Request("http://local/functions/v1/submit-form", {
    method: "POST",
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ form, fields: { consent: true, ...fields }, files, turnstileToken: "token", website: "" }),
  }));
  return { status: res.status, body: await res.json() };
}
const quote = (extra) => submit("quote", { name: "Test Person", company: "", phone: "01234 567890", email: "test@example.invalid", project_details: "", submission_description: "", ...extra });
const lastRow = (table) => state.tables[table].at(-1);
const rows = (table) => (state.tables[table] ?? []).length;

let passed = 0;
async function test(name, body) {
  await body();
  passed++;
  console.log("ok -", name);
}

await test("quote with both fields filled stores them trimmed", async () => {
  const r = await quote({ need_by: "  ASAP  ", location: " Hailsham " });
  assert.equal(r.status, 200);
  assert.equal(lastRow("quote_requests").need_by, "ASAP");
  assert.equal(lastRow("quote_requests").location, "Hailsham");
});

await test("quote with both fields empty stores null (not empty strings)", async () => {
  const r = await quote({ need_by: "", location: "" });
  assert.equal(r.status, 200);
  assert.equal(lastRow("quote_requests").need_by, null);
  assert.equal(lastRow("quote_requests").location, null);
  assert.equal(lastRow("quote_requests").company, "", "other optional fields still stored as empty strings");
});

await test("quote with whitespace-only fields stores null", async () => {
  const r = await quote({ need_by: "   \t ", location: "\n  " });
  assert.equal(r.status, 200);
  assert.equal(lastRow("quote_requests").need_by, null);
  assert.equal(lastRow("quote_requests").location, null);
});

await test("quote without the fields at all (older page) stores null", async () => {
  const r = await quote({});
  assert.equal(r.status, 200);
  assert.equal(lastRow("quote_requests").need_by, null);
  assert.equal(lastRow("quote_requests").location, null);
});

await test("only one field filled", async () => {
  const r = await quote({ need_by: "", location: "Eastbourne" });
  assert.equal(r.status, 200);
  assert.equal(lastRow("quote_requests").need_by, null);
  assert.equal(lastRow("quote_requests").location, "Eastbourne");
});

await test("100 characters is accepted for each field", async () => {
  const r = await quote({ need_by: "n".repeat(100), location: "l".repeat(100) });
  assert.equal(r.status, 200);
  assert.equal(lastRow("quote_requests").need_by.length, 100);
  assert.equal(lastRow("quote_requests").location.length, 100);
});

await test("100 characters plus surrounding spaces is accepted (length is checked after trimming, like other fields)", async () => {
  const r = await quote({ need_by: `  ${"n".repeat(100)}  ` });
  assert.equal(r.status, 200);
  assert.equal(lastRow("quote_requests").need_by.length, 100);
});

for (const key of ["need_by", "location"]) {
  await test(`101 characters in ${key} is rejected like other fields, and nothing is saved`, async () => {
    const before = rows("quote_requests");
    const r = await quote({ [key]: "x".repeat(101) });
    assert.equal(r.status, 400);
    assert.deepEqual(r.body, { error: "Your submission could not be accepted." });
    assert.equal(rows("quote_requests"), before);
  });
}

await test("brochure submission still passes and never stores need_by or location", async () => {
  const r = await submit("brochure", { email: "brochure@example.invalid", need_by: "ASAP", location: "Hailsham" });
  assert.equal(r.status, 200);
  const row = lastRow("brochure_requests");
  assert.equal(row.email, "brochure@example.invalid");
  assert.ok(!("need_by" in row) && !("location" in row));
});

await test("careers submission still passes with one CV and never stores need_by or location", async () => {
  const r = await submit("careers", { name: "Applicant", email: "cv@example.invalid", need_by: "ASAP", location: "Hailsham" }, [{ name: "cv.pdf", type: "application/pdf", size: 1000 }]);
  assert.equal(r.status, 200);
  assert.equal(r.body.uploads.length, 1);
  const row = lastRow("job_applications");
  assert.ok(row.file_path.endsWith("/cv.pdf"));
  assert.ok(!("need_by" in row) && !("location" in row));
});

fake.close();
console.log(`\n${passed} tests passed`);
