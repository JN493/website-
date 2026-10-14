// A tiny in-memory stand-in for the parts of Supabase that retention-cleanup uses.
// PostgREST: GET (select, lt / is.null / in / eq filters, order, limit), DELETE (filters), POST (insert).
// Foreign keys: deleting a contact still referenced by quote_requests or brochure_requests fails with 23503,
// like the real ON DELETE NO ACTION constraints. Storage: remove (DELETE object/<bucket>) and list.
// Nothing here talks to a real Supabase project.
import http from "node:http";

function matches(row, key, raw) {
  const value = row[key];
  if (raw === "is.null") return value === null || value === undefined;
  if (raw === "not.is.null") return value !== null && value !== undefined;
  if (raw.startsWith("eq.")) return String(value) === raw.slice(3);
  if (raw.startsWith("lt.")) return value !== null && value !== undefined && Date.parse(value) < Date.parse(raw.slice(3));
  if (raw.startsWith("in.(")) {
    const list = raw.slice(4, -1).split(",").map((v) => v.replace(/^"|"$/g, ""));
    return value !== null && value !== undefined && list.includes(String(value));
  }
  throw new Error(`fake-supabase: unsupported filter ${key}=${raw}`);
}

function query(rows, params) {
  let out = rows.filter((row) => [...params].every(([k, v]) => ["select", "order", "limit", "offset"].includes(k) || matches(row, k, v)));
  const order = params.get("order");
  if (order) {
    const keys = order.split(",").map((o) => o.split("."));
    const cmp = (a, b) => {
      const [x, y] = [Date.parse(a), Date.parse(b)];
      if (!Number.isNaN(x) && !Number.isNaN(y)) return x - y;
      return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
    };
    out = [...out].sort((a, b) => {
      for (const [col, dir] of keys) {
        const c = cmp(a[col], b[col]) * (dir === "desc" ? -1 : 1);
        if (c !== 0) return c;
      }
      return 0;
    });
  }
  const offset = Number(params.get("offset") ?? 0);
  if (params.get("limit")) out = out.slice(offset, offset + Number(params.get("limit")));
  else out = out.slice(offset);
  const select = params.get("select");
  if (select && select !== "*") {
    const cols = select.split(",").map((c) => c.trim());
    out = out.map((row) => Object.fromEntries(cols.map((c) => [c, row[c]])));
  }
  return out;
}

export function startFake(state) {
  // state: { tables: { name: rows[] }, storage: { bucket: Set<path> }, failPaths: Set<path>, requests: [] }
  const send = (res, status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(body === undefined ? "" : JSON.stringify(body));
  };
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const url = new URL(req.url, "http://fake");
      const body = raw ? JSON.parse(raw) : undefined;
      state.requests.push(`${req.method} ${url.pathname}`);
      (state.fullRequests ??= []).push(`${req.method} ${url.pathname}${decodeURIComponent(url.search)}${body?.prefixes ? " " + body.prefixes.join(",") : ""}`);

      const rest = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
      if (rest) {
        const table = rest[1];
        const rows = (state.tables[table] ??= []);
        if (req.method === "GET") {
          // Optional: state.failGet(table, params) returning true makes this lookup fail, like a database error.
          if (state.failGet?.(table, url.searchParams)) return send(res, 500, { code: "XX000", message: "simulated lookup failure" });
          return send(res, 200, query(rows, url.searchParams));
        }
        if (req.method === "POST") {
          for (const r of [].concat(body)) rows.push({ id: `${table}-${rows.length + 1}`, run_at: new Date().toISOString(), ...r });
          return send(res, 201);
        }
        if (req.method === "DELETE") {
          const doomed = query(rows, new URLSearchParams([...url.searchParams].filter(([k]) => k !== "select")));
          const doomedIds = new Set(doomed.map((r) => r.id));
          if (table === "contacts") {
            const stillUsed = ["quote_requests", "brochure_requests"].some((t) =>
              (state.tables[t] ?? []).some((r) => doomedIds.has(r.contact_id)));
            if (stillUsed) return send(res, 409, { code: "23503", message: "violates foreign key constraint" });
          }
          state.tables[table] = rows.filter((r) => !doomedIds.has(r.id));
          return send(res, 204);
        }
      }

      const remove = url.pathname.match(/^\/storage\/v1\/object\/([a-z-]+)$/);
      if (remove && req.method === "DELETE") {
        const bucket = (state.storage[remove[1]] ??= new Set());
        if (body.prefixes.some((p) => state.failPaths.has(p))) return send(res, 500, { statusCode: "500", error: "InternalError", message: "simulated failure" });
        const removed = body.prefixes.filter((p) => bucket.delete(p)); // missing files are simply not in the list
        return send(res, 200, removed.map((name) => ({ name })));
      }

      const list = url.pathname.match(/^\/storage\/v1\/object\/list\/([a-z-]+)$/);
      if (list && req.method === "POST") {
        const bucket = state.storage[list[1]] ?? new Set();
        const prefix = body.prefix ?? "";
        const found = [...bucket]
          .filter((p) => (p.lastIndexOf("/") === -1 ? "" : p.slice(0, p.lastIndexOf("/"))) === prefix)
          .map((p) => p.slice(p.lastIndexOf("/") + 1))
          .filter((name) => name.startsWith(body.search ?? ""));
        return send(res, 200, found.map((name) => ({ name })));
      }

      send(res, 404, { message: `fake-supabase: no route for ${req.method} ${url.pathname}` });
    });
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ url: `http://localhost:${server.address().port}`, close: () => server.close() })));
}
