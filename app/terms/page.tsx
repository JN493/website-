import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | SLS Fabrications",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <main className="p-6 max-w-2xl mx-auto text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
      <p className="mb-4">Last updated: 8 October 2026</p>
      <p className="mb-4">
        This website is run by SLS Fabrications Limited (company number 03187824), registered office 30-34 North Street, Hailsham, East Sussex, BN27 1DW. By using this website, you agree to these terms.
      </p>

      <h2 className="font-bold mt-6 mb-2">Content</h2>
      <p className="mb-4">
        All content on this website (text, images and logos) belongs to SLS Fabrications Limited unless we say otherwise. You may not copy or reuse it without our written permission.
      </p>

      <h2 className="font-bold mt-6 mb-2">Quotes and enquiries</h2>
      <p className="mb-4">
        A quote request sent through this website is an enquiry, not an order. Any price we give is an estimate until we confirm it in writing after reviewing your requirements.
      </p>

      <h2 className="font-bold mt-6 mb-2">Accuracy</h2>
      <p className="mb-4">
        We take care to keep this website accurate and up to date, but we do not promise that everything on it is complete or current.
      </p>

      <h2 className="font-bold mt-6 mb-2">Liability</h2>
      <p className="mb-4">
        We are not responsible for loss that results from using this website, as far as the law allows. Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for anything else the law does not allow us to limit.
      </p>

      <h2 className="font-bold mt-6 mb-2">Links to other sites</h2>
      <p className="mb-4">
        This website may link to other websites, such as Google Maps. We do not control them and are not responsible for what they contain.
      </p>

      <h2 className="font-bold mt-6 mb-2">Changes</h2>
      <p className="mb-4">We may change these terms. If you keep using the website after a change, you accept the new terms.</p>

      <h2 className="font-bold mt-6 mb-2">Law</h2>
      <p className="mb-4">
        These terms are governed by the law of England and Wales, and the courts of England and Wales can deal with any dispute about them.
      </p>

      <h2 className="font-bold mt-6 mb-2">Contact</h2>
      <p className="mb-4">
        SLS Fabrications Limited, Unit 2 Hythe Works, Diplocks Way, Hailsham, BN27 3JF
        <br />
        <a href="tel:01323846061" className="underline">01323 846061</a> | <a href="mailto:info@slsfabrications.com" className="underline">info@slsfabrications.com</a>
      </p>
    </main>
  );
}
