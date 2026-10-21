"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Click-to-load Google Map: nothing is requested from Google until the visitor clicks "Show map".
// Fills its parent: the size is set by whoever places it (see Footer.tsx).
export default function MapEmbed({ src, title }: { src: string; title: string }) {
  const [show, setShow] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  // The button disappears on click, so move keyboard focus to the map instead of losing it.
  useEffect(() => {
    if (show) frame.current?.focus();
  }, [show]);

  if (show) {
    return <iframe ref={frame} title={title} src={src} className="block w-full h-full rounded-lg" style={{ border: 0 }} loading="lazy"></iframe>;
  }

  return (
    <div className="on-light h-full w-full rounded-lg border border-line bg-tint text-muted flex flex-col items-center justify-center gap-3 px-4 text-center">
      <button type="button" onClick={() => setShow(true)} className="btn btn-secondary">
        Show map
      </button>
      <p>
        Loads a map from Google. See our <Link href="/cookies" className="text-brand underline underline-offset-2">Cookie Policy</Link>.
      </p>
    </div>
  );
}
