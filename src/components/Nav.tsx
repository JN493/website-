"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const links = [
  ["/about", "About"],
  ["/capabilities", "Capabilities"],
  ["/industries", "Industries"],
  ["/projects", "Projects"],
  ["/contact", "Contact"],
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the open menu and returns focus to the menu button.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="flex flex-wrap items-center justify-between px-6 py-4 border-b">
      <Link href="/" aria-label="SLS Fabrications home" className="font-bold text-xl">SLS</Link>
      <nav aria-label="Main" className="hidden md:flex gap-6 text-sm">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <button
        type="button"
        ref={buttonRef}
        className="md:hidden -m-3 flex min-h-11 min-w-11 items-center justify-center text-xl leading-none"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Main" className="md:hidden basis-full flex flex-col gap-4 pt-4 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="py-2 -my-2">{label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
