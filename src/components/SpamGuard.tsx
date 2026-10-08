"use client";
import { useEffect, useRef } from "react";

// Hidden field real people never see or fill in. Bots that fill every field give themselves away.
export function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      aria-hidden="true"
      tabIndex={-1}
      autoComplete="off"
      className="absolute -left-[9999px]"
    />
  );
}

// Records when the form was shown (or shown again), for the minimum fill time check.
export function useShownAt(shown = true) {
  const shownAt = useRef(0);
  useEffect(() => {
    if (shown) shownAt.current = Date.now();
  }, [shown]);
  return shownAt;
}

// Likely a bot: honeypot filled, or submitted within 2 seconds of the form appearing.
// Callers fake a normal success and save nothing, so the bot gets no signal.
export function looksLikeBot(data: FormData, shownAt: number) {
  return String(data.get("website") ?? "").trim() !== "" || Date.now() - shownAt < 2000;
}
