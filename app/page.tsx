import type { Metadata } from "next";
import HeroCarousel from "@/components/HeroCarousel";

const tagline = "Sheet metal and welding specialists, bespoke service & designs from small to large scale projects.";

export const metadata: Metadata = {
  title: "SLS Fabrications | Steel Welding & Fabrication in Hailsham",
  description: tagline,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main id="main">
      <section className="container-page pb-8 pt-10 sm:pb-10 sm:pt-16">
        <h1 className="text-4xl font-bold tracking-tight text-brand sm:text-5xl">SLS Fabrications</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted sm:text-xl">{tagline}</p>
      </section>
      <div className="container-page">
        <HeroCarousel />
      </div>
    </main>
  );
}
