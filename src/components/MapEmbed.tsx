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
    // Brand blue like the footer, with a 1px light outline so the box still shows; white text and a white-outlined
    // button (white on #004167 is 10.76:1). It sits inside the footer's .on-dark, so focus rings are white.
    <div className="h-full w-full rounded-lg border border-white/50 bg-brand text-white flex flex-col items-center justify-center gap-3 px-4 text-center">
      <button type="button" onClick={() => setShow(true)} className="btn border-2 border-white bg-transparent text-white hover:bg-white/10">
        Show map
      </button>
      <p>
        Loads a map from Google. See our <Link href="/cookies" className="text-white underline underline-offset-2">Cookie Policy</Link>.
      </p>
    </div>
  );
}
