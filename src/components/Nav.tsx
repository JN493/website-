"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/about", "About"],
  ["/capabilities", "Capabilities"],
  ["/industries", "Industries"],
  ["/projects", "Projects"],
  ["/contact", "Contact"],
];

// The page the visitor is on: tinted background plus a 2px brand underline (so it is not shown by colour alone),
// with aria-current="page" for screen readers. #004167 is the brand colour (--color-brand).
const activeClass = "bg-tint text-brand shadow-[inset_0_-2px_0_0_#004167]";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const current = pathname.replace(/\/$/, ""); // "/about/" and "/about" are the same page
  const isHome = current === "";

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
    // The home page only has a taller bar and a larger logo (bigger file made from the original artwork).
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className={`container-page flex items-center justify-between ${isHome ? "h-20 lg:h-24" : "h-[var(--header-h)]"}`}>
      <Link href="/" aria-label="SLS Fabrications home" className="rounded-sm">
        {isHome ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, images are unoptimised anyway
          <img
            src="/images/logo/logo-blue-lg.png"
            srcSet="/images/logo/logo-blue-lg.png 300w, /images/logo/logo-blue-lg@2x.png 600w"
            sizes="(min-width: 64rem) 160px, 120px"
            width={160}
            height={82}
            alt=""
            className="h-auto w-[120px] lg:w-[160px]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- static export, images are unoptimised anyway
          <img src="/images/logo/logo-blue.png" srcSet="/images/logo/logo-blue.png 1x, /images/logo/logo-blue@2x.png 2x" width={102} height={52} alt="" />
        )}
      </Link>
      <div className="hidden items-center gap-1 md:flex">
        <nav aria-label="Main" className="flex gap-1 text-[0.9375rem] font-medium">
          {links.map(([href, label]) => {
            const active = current === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-2 py-2 lg:px-3 ${active ? activeClass : "text-ink hover:bg-tint hover:text-brand"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        {/* Brand blue like the other solid buttons, a little smaller, and a darker navy (#001d2e) on hover/focus; separate from the menu links. */}
        <Link href="/contact#quote" className="btn btn-primary ml-2 min-h-10 px-4 py-1.5 text-sm hover:bg-[#001d2e] focus-visible:bg-[#001d2e] lg:ml-3">Request a Quote</Link>
      </div>
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
          {links.map(([href, label]) => {
            const active = current === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-2 py-3 ${active ? activeClass : "text-ink hover:bg-tint hover:text-brand"}`}
              >
                {label}
              </Link>
            );
          })}
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/contact#quote" onClick={() => setOpen(false)} className="btn btn-primary">Request a Quote</Link>
            <a href="tel:01323846061" className="btn btn-secondary">Call 01323 846061</a>
          </div>
        </nav>
      )}
    </header>
  );
}
