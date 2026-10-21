"use client";
import { useEffect, useRef } from "react";

// Fades a section or card up once, the first time it scrolls into view (CSS in globals.css, [data-reveal]).
// Progressive enhancement: the server HTML has no data-reveal, so without JavaScript (and in print) everything is visible.
// Nothing is hidden until the visitor first scrolls, and then only elements still fully below the viewport,
// so the first view, full-page screenshots and anything on screen never show hidden content.
// Reduced motion: never hidden. Keyboard focus inside shows it at once (no fade). No storage.
export default function Reveal({ as = "div", className, children }: { as?: "div" | "li" | "section"; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) finish("shown");
    });
    function finish(state: "shown" | "instant") {
      if (el!.dataset.reveal === "pending") el!.dataset.reveal = state;
      stop();
    }
    const onFocus = () => finish("instant");
    function onFirstScroll() {
      window.removeEventListener("scroll", onFirstScroll);
      if (el!.getBoundingClientRect().top < window.innerHeight) return; // already on screen or passed: never hidden
      el!.dataset.reveal = "pending";
      observer.observe(el!);
      el!.addEventListener("focusin", onFocus);
    }
    function stop() {
      window.removeEventListener("scroll", onFirstScroll);
      observer.disconnect();
      el!.removeEventListener("focusin", onFocus);
    }
    window.addEventListener("scroll", onFirstScroll, { passive: true });
    return stop;
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
