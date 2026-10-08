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
    return <iframe ref={frame} title={title} src={src} className="block w-full h-full" style={{ border: 0 }} loading="lazy"></iframe>;
  }

  return (
    <div className="h-full w-full border bg-gray-50 flex flex-col items-center justify-center gap-3 px-4 text-center">
      <button type="button" onClick={() => setShow(true)} className="border bg-white px-6 py-3 font-semibold text-gray-900">
        Show map
      </button>
      <p>
        Loads a map from Google. See our <Link href="/cookies" className="underline">Cookie Policy</Link>.
      </p>
    </div>
  );
}
