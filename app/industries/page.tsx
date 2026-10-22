import type { Metadata } from "next";
import Link from "next/link";
import TileGrid from "@/components/TileGrid";
import PageHeader from "@/components/PageHeader";
import { industries } from "@/lib/industries";

export const metadata: Metadata = {
  title: "Industries We Serve | SLS Fabrications, Hailsham",
  description: "From airport maintenance to pharmaceutical, see the sectors SLS Fabrications has delivered real projects for, direct and as a trusted subcontractor.",
  alternates: { canonical: "/industries" },
};

export default function Industries() {
  return (
    <main id="main">
      <PageHeader title="Industries">
        <p>
          SLS Fabrications works across a broad range of industries, manufacturing everything from engineered components and industrial equipment to architectural metalwork and custom installations.
        </p>
        <p className="mt-3">Explore some of the sectors we work in and contact us to discuss your project today.</p>
      </PageHeader>
      <div className="container-page py-12 sm:py-16">
        <TileGrid tiles={industries.map((i) => ({ title: i.title, description: i.subtitle }))} />
        {/* /contact#quote opens the quote form (app/contact/page.tsx reads the hash). */}
        <div className="mt-14">
          <Link href="/contact#quote" className="btn btn-primary">
            Request a Quote <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
