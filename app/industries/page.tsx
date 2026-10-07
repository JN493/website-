import TileGrid from "@/components/TileGrid";

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
