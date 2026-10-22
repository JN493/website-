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
    // Sticky; its height is --header-h (globals.css), which scroll-padding-top uses so nothing hides under it.
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="container-page flex h-[var(--header-h)] items-center justify-between">
      <Link href="/" aria-label="SLS Fabrications home" className="rounded-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, images are unoptimised anyway */}
        <img src="/images/logo/logo-blue.png" srcSet="/images/logo/logo-blue.png 1x, /images/logo/logo-blue@2x.png 2x" width={102} height={52} alt="" />
      </Link>
      <nav aria-label="Main" className="hidden md:flex gap-1 text-[0.9375rem] font-medium">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-md px-3 py-2 text-ink hover:bg-tint hover:text-brand">{label}</Link>
        ))}
      </nav>
      <button
        type="button"
        ref={buttonRef}
        className="md:hidden -mr-2 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-2xl leading-none text-brand"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Main" className="md:hidden container-page flex flex-col border-t border-line pb-4 pt-2 font-medium">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 text-ink hover:bg-tint hover:text-brand">{label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
