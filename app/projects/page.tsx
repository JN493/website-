import type { Metadata } from "next";
import BrochureForm from "@/components/BrochureForm";

export const metadata: Metadata = {
  title: "Our Work & Case Studies | SLS Fabrications",
  description: "Browse real fabrication projects across industries, or download our brochure to see the full range of SLS Fabrications' work.",
  alternates: { canonical: "/projects" },
};

export default function Projects() {
  return (
    <main className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <section className="border p-6">
        <h2 className="text-xl font-semibold mb-2">Discover what SLS Fabrications can do for your business</h2>
        <p className="text-gray-600 text-sm mb-6">
          Get an overview of our services and projects in one place. Enter your email to receive a copy in your inbox.
        </p>
        <BrochureForm />
      </section>
    </main>
  );
}
