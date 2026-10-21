import type { Metadata } from "next";
import TileGrid from "@/components/TileGrid";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Industries We Serve | SLS Fabrications, Hailsham",
  description: "From airport maintenance to pharmaceutical, see the sectors SLS Fabrications has delivered real projects for, direct and as a trusted subcontractor.",
  alternates: { canonical: "/industries" },
};

const industries = [
  "Airport maintenance",
  "Water & wastewater",
  "Spas & health clubs",
  "Pharmaceutical",
  "Exhibitions & events",
  "Commercial & cladding",
  "Office & restaurant fit-outs",
  "Vehicle repairs",
  "Pumps & shrouds",
  "Architectural",
  "Defence & security",
  "Signage",
];

export default function Industries() {
  return (
    <main id="main">
      <PageHeader title="Industries" />
      <div className="container-page py-12 sm:py-16">
      <TileGrid tiles={industries.map((title) => ({ title }))} />
      </div>
    </main>
  );
}
