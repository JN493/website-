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
      <section className="container-page pb-8 pt-10 sm:pb-10 sm:pt-16">
        <h1 className="text-4xl font-bold tracking-tight text-brand sm:text-5xl">SLS Fabrications</h1>
      </section>
      <div className="container-page">
        <HeroCarousel />
      </div>
    </main>
  );
}
