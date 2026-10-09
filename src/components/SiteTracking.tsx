"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";
import { captureSource } from "@/lib/source";

// Mounted once in app/layout.tsx. Records the visit's source on first load, and tracks
// every tel: and mailto: link on the site with one delegated click listener.
export default function SiteTracking() {
  useEffect(() => {
    captureSource();

    function onClick(e: MouseEvent) {
      const link = e.target instanceof Element ? e.target.closest("a") : null;
      const href = link?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) track("phone_click");
      else if (href.startsWith("mailto:")) track("email_click");
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
