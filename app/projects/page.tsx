import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Work & Case Studies | SLS Fabrications",
  description: "Browse real fabrication projects across industries, or download our brochure to see the full range of SLS Fabrications' work.",
  alternates: { canonical: "/projects" },
};

export default function Projects() {
  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <p className="text-gray-600 text-sm mb-6">Case studies go here once photos and project details are available.</p>
      <div className="flex gap-4">
        <button className="border px-6 py-3 font-semibold">Download Brochure</button>
        <Link href="/contact#quote" className="bg-black text-white px-6 py-3 font-semibold">Request a Quote</Link>
      </div>
      <p className="text-gray-500 text-xs mt-2">Brochure download to be wired up to collect email for mailing list.</p>
    </main>
  );
}
