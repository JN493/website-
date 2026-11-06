import type { Metadata } from "next";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import { pageMetadata } from "@/lib/pageMetadata";

// Home meta description (no longer shown on the page: the hero slides carry the text now).
const tagline = "Sheet metal and welding specialists, bespoke service & designs from small to large scale projects.";

export const metadata: Metadata = pageMetadata({
  title: "SLS Fabrications | Steel Welding & Fabrication in Hailsham",
  description: tagline,
  path: "/",
});

export default function Home() {
  return (
    <main id="main">
      {/* The page's h1 for search engines and screen readers; the logo in the header carries the name visually. */}
      <h1 className="sr-only">SLS Fabrications</h1>
      <div className="container-page pt-4 sm:pt-6">
        <HeroCarousel />
      </div>
      {/* Copy is the consultant's About copy (subtitle and first paragraph), word for word. */}
      <section className="container-page py-12 sm:py-16">
        <div className="max-w-3xl">
          <h2 className="accent-line text-2xl font-semibold text-ink sm:text-3xl">
            Experience at Our Core. Innovation in Our Thinking.
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-ink">
            With decades of experience, SLS Fabrications combines technical expertise, skilled workmanship and forward-thinking ideas to deliver precision metal fabrication.
          </p>
          <Link href="/about" className="btn btn-secondary mt-8">
            About Us <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
