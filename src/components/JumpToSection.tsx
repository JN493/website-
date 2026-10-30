"use client";

// A link to a section further down the page that also moves keyboard focus there, so keyboard and screen reader
// users land on the section's heading (give it tabIndex={-1}). Smooth scroll unless the visitor prefers reduced
// motion. The site-wide scroll-padding-top (globals.css) keeps the target clear of the sticky header.
// Without JavaScript it is a plain #id link.
export default function JumpToSection({ target, focusId, className, children }: { target: string; focusId: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${target}`}
      className={className}
      onClick={(e) => {
        const section = document.getElementById(target);
        const focusEl = document.getElementById(focusId);
        if (!section || !focusEl) return;
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        focusEl.focus({ preventScroll: true });
      }}
    >
      {children}
    </a>
  );
}
