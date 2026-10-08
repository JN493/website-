import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SLS Fabrications | Steel Welding & Fabrication in Hailsham",
  description: "Steel fabrication, welding, folding and finishing from our Hailsham, East Sussex workshop, trusted across multiple industries. Request a quote today.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">SLS Fabrications</h1>
      <p className="text-gray-600 mt-2">Steel, shaped to spec.</p>
    </main>
  );
}
