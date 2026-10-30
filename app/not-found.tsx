import type { Metadata } from "next";
import Link from "next/link";
import LaserNumerals from "@/components/LaserNumerals";
import { pageMetadata } from "@/lib/pageMetadata";

// No path: the 404 page has no canonical or og:url (Next.js adds noindex).
export const metadata: Metadata = pageMetadata({
  title: "Page not found | SLS Fabrications",
  description: "The page you're looking for doesn't exist or has moved.",
});

// Not the tinted PageHeader band: the "laser-cut" numerals sit beside the text on white (their light tint fill would
// vanish on the tint). Same h1 and intro styles as PageHeader. Numerals above the text on phones, left-aligned with
// it; from md (768px) a row, numerals left, text and buttons right, vertically centred.
export default function NotFound() {
  return (
    <main id="main">
      <div className="container-page py-12 sm:py-16">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-12">
          {/* Decorative (aria-hidden, plays once, still with reduced motion). 120px wide on phones, 150px from md. */}
          <LaserNumerals className="w-[120px] shrink-0 md:w-[150px]" />
          <div>
            <h1 className="accent-line text-3xl font-bold tracking-tight text-brand sm:text-4xl">Page not found</h1>
            <p className="mt-4 max-w-3xl text-lg text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/" className="btn btn-primary">Back to home</Link>
              <Link href="/contact" className="btn btn-secondary">Contact us</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
