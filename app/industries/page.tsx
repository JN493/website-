import type { Metadata } from "next";
import TileGrid from "@/components/TileGrid";

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
    <main className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Industries</h1>
      <TileGrid tiles={industries.map((title) => ({ title }))} />
    </main>
  );
}
