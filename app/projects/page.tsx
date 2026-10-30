import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import BrochureForm from "@/components/BrochureForm";
import PageHeader from "@/components/PageHeader";

// Title and description on hold (2026-10-30): unchanged until decided.
export const metadata: Metadata = pageMetadata({
  title: "Our Work & Case Studies | SLS Fabrications",
  description: "Browse real fabrication projects across industries, or download our brochure to see the full range of SLS Fabrications' work.",
  path: "/projects",
});

export default function Projects() {
  return (
    <main id="main">
      <PageHeader title="Projects" />
      <div className="container-page py-12 sm:py-16">
      <section className="card max-w-2xl">
        <h2 className="text-xl font-semibold text-brand mb-2">Discover what SLS Fabrications can do for your business</h2>
        <p className="text-muted mb-6">
          Get an overview of our services and projects in one place. Enter your email to receive a copy in your inbox.
        </p>
        <BrochureForm />
      </section>
      </div>
    </main>
  );
}
