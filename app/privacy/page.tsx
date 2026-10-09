import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SLS Fabrications",
  alternates: { canonical: "/privacy" },
};

const email = <a href="mailto:info@slsfabrications.com" className="underline">info@slsfabrications.com</a>;
const phone = <a href="tel:01323846061" className="underline">01323 846061</a>;

export default function Privacy() {
  return (
    <main className="p-6 max-w-2xl mx-auto text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: 9 October 2026</p>
      <p className="mb-4">
        This policy explains what personal data SLS Fabrications Limited collects through this website, why we collect it, how long we keep it and what your rights are. It follows UK data protection law (UK GDPR and the Data Protection Act 2018).
      </p>

      <h2 className="font-bold mt-6 mb-2">Who we are</h2>
      <p className="mb-4">SLS Fabrications Limited (company number 03187824) is the controller of your personal data.</p>
      <p className="mb-4">
        Registered office: 30-34 North Street, Hailsham, East Sussex, BN27 1DW.
        <br />
        Workshop: Unit 2 Hythe Works, Diplocks Way, Hailsham, BN27 3JF.
        <br />
        Phone: {phone}
        <br />
        Email: {email}
      </p>
      <p className="mb-4">ICO registration number: [add once registered]</p>

      <h2 className="font-bold mt-6 mb-2">What we collect and why</h2>
      <p className="mb-4">
        <strong>Quote requests.</strong> If you ask for a quote we collect your name, phone number and email address. You can also give us your company name, project details, a description of what you are sending and any files you attach. We use this to respond to your request and prepare a quote. We keep it for 12 months after we last had contact with you, then delete it. Records of work we carry out and financial records are kept separately for as long as the law requires.
      </p>
      <p className="mb-4">
        <strong>Brochure requests.</strong> If you ask for our brochure we collect your email address and the time you agreed. We use it to send you the brochure. We rely on your consent, which you give by ticking the box. We keep it for 12 months after we send the brochure, then delete it.
      </p>
      <p className="mb-4">If you contact us more than once with the same email address, we keep your details together in one contact record.</p>
      <p className="mb-4">
        <strong>Applications to join our team.</strong> If you send us your CV we collect your name, email address and your CV. We use it to consider you for roles, now or in the future. We rely on your consent, which you give by ticking the box. We keep it for 12 months, then delete it.
      </p>
      <p className="mb-4">
        <strong>Technical data.</strong> When you use a form, the security check described below handles your IP address and some browser information. We do not use this data for anything else.
      </p>
      <p className="mb-4">
        <strong>Where you found us.</strong> When you ask for a quote or the brochure, we also record the page you were on, the website you came from and any campaign details in the link you used. We use this to see which of our marketing brings in enquiries. We keep it with the request it came with.
      </p>
      <p className="mb-4">
        We do not use analytics or advertising tools on this website at the moment. If we add them, we will update this policy and our Cookie Policy first.
      </p>

      <h2 className="font-bold mt-6 mb-2">Who we share it with</h2>
      <p className="mb-4">
        We do not sell your personal data. We use these services to run the website, and they handle data on our behalf:
      </p>
      <ul className="list-disc pl-5 mb-4">
        <li><strong>Supabase</strong> stores form submissions and uploaded files. Our database is hosted in London.</li>
        <li><strong>Cloudflare</strong> hosts this website and provides the security check (Turnstile) on our forms. The check receives your IP address and browser information to tell people from automated bots.</li>
        <li><strong>Google</strong> provides the map on our pages, but only if you click to show it. See our Cookie Policy.</li>
        <li><strong>Microsoft</strong> provides our email, so messages you send to us by email pass through its systems.</li>
      </ul>
      <p className="mb-4">We may also share data if the law requires it.</p>

      <h2 className="font-bold mt-6 mb-2">Where your data goes</h2>
      <p className="mb-4">
        Our database and stored files are held in the UK (London). Some of the other services we use, including Cloudflare and Google, are run by companies based in the United States and may handle your data outside the UK. They explain how they protect transferred data in their own privacy policies.
      </p>

      <h2 className="font-bold mt-6 mb-2">Your rights</h2>
      <p className="mb-4">You can ask us to:</p>
      <ul className="list-disc pl-5 mb-4">
        <li>see the personal data we hold about you</li>
        <li>correct anything that is wrong</li>
        <li>delete your data</li>
        <li>limit or stop how we use it</li>
        <li>give you a copy of your data in a usable format</li>
      </ul>
      <p className="mb-4">If we rely on your consent, you can withdraw it at any time. This does not affect anything we did before.</p>
      <p className="mb-4">To use any of these rights, contact us at {email} or on {phone}.</p>
      <p className="mb-4">
        If you are unhappy with how we handle your data, you can complain to the Information Commissioner&apos;s Office at ico.org.uk/make-a-complaint. We would appreciate the chance to put things right first.
      </p>

      <h2 className="font-bold mt-6 mb-2">Changes</h2>
      <p className="mb-4">We may update this policy. The date at the top shows when it last changed.</p>
    </main>
  );
}
