import type { Metadata } from "next";
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
    </main>
  );
}
