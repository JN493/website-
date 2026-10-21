import type { Metadata } from "next";
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
      <PageHeader title="Capabilities" />
      <div className="container-page py-12 sm:py-16">
      <TileGrid
        tiles={capabilities.map((c) => ({
          title: c.title,
          description: c.description,
          image: c.image,
          href: c.ready ? `/capabilities/${c.slug}` : undefined,
        }))}
      />
      </div>
    </main>
  );
}
