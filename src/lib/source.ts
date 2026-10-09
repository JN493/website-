// Where a visitor came from, recorded once per page session and sent with quote and brochure requests.
// Held in this module's memory only: it survives client-side navigation but not a reload.
// Never write it to cookies, localStorage, sessionStorage or IndexedDB (the Cookie Policy says the site stores nothing).

export type Source = {
  landing_page: string;
  referrer: string | null;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

let source: Source | null = null;

export function captureSource() {
  if (source || typeof window === "undefined") return;

  // Other sites only: hostname and path, no query string or hash.
  let referrer: string | null = null;
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.hostname !== location.hostname) referrer = (ref.hostname + ref.pathname).slice(0, 200);
  } catch {
    referrer = null;
  }

  const captured: Source = { landing_page: location.pathname, referrer };
  const params = new URLSearchParams(location.search);
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().slice(0, 200);
    if (value) captured[key] = value;
  }
  source = captured;
}

export function getSource() {
  return source;
}
