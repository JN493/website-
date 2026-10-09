// Pushes a named event onto window.dataLayer, ready for a tag manager later.
// No tag manager is installed, so for now these are harmless array items.
// Event name only: never put personal data (names, emails, phone numbers, messages, file names) in here.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: string) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event });
}
