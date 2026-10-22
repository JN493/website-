import type { Metadata } from "next";
import Link from "next/link";
import TileGrid from "@/components/TileGrid";
import PageHeader from "@/components/PageHeader";
import { capabilities } from "@/lib/capabilities";

export const metadata: Metadata = {
  title: "Welding, Fabrication & CNC Services | Hailsham, East Sussex",
  description: "From CAD design and welding to CNC machining and powder coating, explore our full range of fabrication capabilities.",
  alternates: { canonical: "/capabilities" },
};

export default function Capabilities() {
  return (
    <main id="main">
      <PageHeader title="Capabilities">
        <p>
          Explore our manufacturing capabilities, from surveying and CAD design through to fabrication, finishing and delivery. Whether you need a single component or a complete fabricated assembly, we have the expertise to support your project.
        </p>
      </PageHeader>
      <div className="container-page py-12 sm:py-16">
        <TileGrid tiles={capabilities.map((c) => ({ title: c.title, description: c.subtitle, image: c.image }))} />
        {/* /contact#quote opens the quote form (app/contact/page.tsx reads the hash). */}
        <div className="mt-14 flex flex-col items-start gap-4">
          <p className="text-lg font-semibold text-ink">Already have a project in mind?</p>
          <Link href="/contact#quote" className="btn btn-primary">
            Request a Quote <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
