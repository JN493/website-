"use client";
import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile bot check. Widget mode (Managed) is set on the widget in the Cloudflare dashboard.
// The token proves nothing on its own: the submit-form Edge Function verifies it with Cloudflare.

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_WAIT_MESSAGE = "Please wait for the security check to finish before submitting.";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// Load the script once per page, however many forms ask for it.
let scriptPromise: Promise<TurnstileApi> | null = null;
function loadTurnstile() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
      script.onerror = () => {
        scriptPromise = null; // allow a retry on the next mount
        reject(new Error("turnstile failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// onToken gets the token when the check passes, and null when it expires or fails.
// Change resetKey after every submission: tokens are single use.
export default function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [message, setMessage] = useState("");

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widgetId.current = turnstile.render(container.current, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          callback: (token: string) => {
            setMessage("");
            onTokenRef.current(token);
          },
          // Turnstile refreshes expired checks and retries failed ones by itself.
          "expired-callback": () => {
            onTokenRef.current(null);
            setMessage("The security check expired and is refreshing. Please wait a moment.");
          },
          "error-callback": () => {
            onTokenRef.current(null);
            setMessage("The security check couldn't complete. It will retry, or you can refresh the page.");
          },
        });
      })
      .catch(() => {
        if (!cancelled) setMessage("The security check couldn't load. Please refresh the page, or call us on 01323 846061.");
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return;
    onTokenRef.current(null);
    window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  return (
    <div>
      <div ref={container} />
      {message && <p role="alert" className="text-sm text-red-700 mt-2">{message}</p>}
    </div>
  );
}
