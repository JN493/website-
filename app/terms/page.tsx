import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | SLS Fabrications",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <main className="p-6 max-w-2xl mx-auto text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
      <p className="mb-4">By using this website, you agree to the following terms.</p>
      <h2 className="font-bold mt-6 mb-2">Content</h2>
      <p className="mb-4">All content on this site is the property of SLS Fabrications unless otherwise stated.</p>
      <h2 className="font-bold mt-6 mb-2">Quotes & Enquiries</h2>
      <p className="mb-4">Quotes requested via this website are estimates only, subject to confirmation.</p>
    </main>
  );
}
