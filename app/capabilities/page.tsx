import TileGrid from "@/components/TileGrid";
import { capabilities } from "@/lib/capabilities";

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
