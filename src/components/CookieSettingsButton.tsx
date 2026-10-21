"use client";

declare global {
  interface Window {
    Cookiebot?: { renew: () => void };
  }
}

// Reopens the Cookiebot consent dialog (Cookiebot.renew()). Does nothing if the Cookiebot script failed to load.
export default function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => window.Cookiebot?.renew?.()} className="py-2 -my-2 cursor-pointer">
      Cookie settings
    </button>
  );
}
