// Fake Microsoft Graph (token endpoint and sendMail) plus Turnstile siteverify, answered through a fetch stub.
// Nothing here talks to the network: any other URL goes to the real fetch (the local fake Supabase).
export function installFakeGraph() {
  const graph = { tokenCalls: 0, sendAttempts: 0, mails: [], failToken: false, failSend: false, sendDelayMs: 0, signals: [] };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("https://challenges.cloudflare.com/turnstile/v0/siteverify")) return Response.json({ success: true });
    if (url.startsWith("https://login.microsoftonline.com/")) {
      graph.tokenCalls++;
      graph.signals.push(!!init.signal);
      graph.lastTokenRequest = { url, body: String(init.body) };
      if (graph.failToken) return new Response("{}", { status: 401 });
      // 30s lifetime is inside the function's 60s refresh margin, so every send fetches a token (makes token failures testable).
      return Response.json({ access_token: "fake-graph-token", expires_in: 30 });
    }
    if (url.startsWith("https://graph.microsoft.com/")) {
      graph.sendAttempts++;
      graph.signals.push(!!init.signal);
      if (graph.sendDelayMs) await new Promise((r) => setTimeout(r, graph.sendDelayMs));
      // A realistic error body that contains an address, to prove it never reaches the logs.
      if (graph.failSend) return new Response(JSON.stringify({ error: { message: "Mailbox info@example.invalid not found" } }), { status: 500 });
      graph.mails.push({ url, method: init.method, auth: init.headers?.Authorization, payload: JSON.parse(init.body) });
      return new Response(null, { status: 202 });
    }
    return realFetch(input, init);
  };
  return graph;
}

// Collects everything written to the console, so tests can check no personal data is logged.
export function captureLogs() {
  const lines = [];
  for (const level of ["log", "warn", "error", "info", "debug"]) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      lines.push(args.map(String).join(" "));
      if (level !== "log") original(...args);
    };
  }
  return lines;
}
