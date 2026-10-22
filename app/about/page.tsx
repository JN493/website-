import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About SLS Fabrications | Hailsham, East Sussex",
  description: "Meet the team behind SLS Fabrications, skilled welders and fabricators delivering precision work from our Hailsham workshop.",
  alternates: { canonical: "/about" },
};

// Copy is the consultant's (2026-10-22): use it word for word.
export default function About() {
  return (
    <main id="main">
      <PageHeader title="About">
        <p>Experience at Our Core. Innovation in Our Thinking.</p>
      </PageHeader>
      <div className="container-page py-12 sm:py-16">
        <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-ink">
          <p>
            With decades of experience, SLS Fabrications combines technical expertise, skilled workmanship and forward-thinking ideas to deliver precision metal fabrication.
          </p>
          <p>
            Based in East Sussex, we work across a diverse range of sectors, including engineering, water infrastructure, architecture, commercial environments and bespoke installations.
          </p>
          <p>
            From individual components to large-scale commercial projects, we work alongside our customers to understand their requirements and develop practical solutions tailored to each brief.
          </p>
          <p>
            Our collaborative approach brings together technical precision, clear communication and effective project coordination, keeping work on track and focused on the end result.
          </p>
          <p>
            Whether you&apos;re developing a new concept, sourcing specialist components or seeking a long-term fabrication partner, we have the expertise to turn your requirements into results.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/projects" className="btn btn-primary">
            Explore Our Work <span aria-hidden="true">→</span>
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Get in Touch <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
