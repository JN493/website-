"use client";
import { useState } from "react";
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

  return (
    <header className="flex flex-wrap items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-bold text-xl">SLS</Link>
      <nav className="hidden md:flex gap-6 text-sm">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <button
        type="button"
        className="md:hidden text-xl leading-none"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>
      {open && (
        <nav id="mobile-menu" className="md:hidden basis-full flex flex-col gap-4 pt-4 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
