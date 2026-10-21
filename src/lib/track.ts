// Pushes a named event onto window.dataLayer, which Google Tag Manager (GTM-M995FM9J, loaded in app/layout.tsx) reads.
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
