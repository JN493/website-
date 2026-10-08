import type { Metadata } from "next";
import TileGrid from "@/components/TileGrid";
import { capabilities } from "@/lib/capabilities";

export const metadata: Metadata = {
  title: "Welding, Fabrication & CNC Services | Hailsham, East Sussex",
  description: "From CAD design and welding to CNC machining and powder coating, explore our full range of fabrication capabilities.",
  alternates: { canonical: "/capabilities" },
};

export default function Capabilities() {
  return (
    <main className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Capabilities</h1>
      <TileGrid
        tiles={capabilities.map((c) => ({
          title: c.title,
          description: c.description,
          image: c.image,
          href: c.ready ? `/capabilities/${c.slug}` : undefined,
        }))}
      />
    </main>
  );
}
