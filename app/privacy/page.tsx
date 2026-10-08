import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SLS Fabrications",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <main className="p-6 max-w-2xl mx-auto text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">SLS Fabrications is committed to protecting your privacy. This policy explains what personal data we collect, why, and how we use it, in line with UK GDPR.</p>
      <h2 className="font-bold mt-6 mb-2">What we collect</h2>
      <ul className="list-disc pl-5 mb-4">
        <li>Contact details you provide when requesting a quote, downloading our brochure, or contacting us</li>
        <li>Website analytics data</li>
        <li>Information submitted via our quote request form</li>
      </ul>
      <h2 className="font-bold mt-6 mb-2">Your rights</h2>
      <p className="mb-4">Under UK GDPR, you have the right to access, correct, or request deletion of your personal data. Contact us on 01323 846061.</p>
    </main>
  );
}
