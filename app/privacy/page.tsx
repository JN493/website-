import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | SLS Fabrications",
  description: "How SLS Fabrications collects, uses and protects your personal data through this website.",
  path: "/privacy",
});

const email = <a href="mailto:info@slsfabrications.com" className="text-brand underline underline-offset-2">info@slsfabrications.com</a>;
const phone = <a href="tel:01323846061" className="text-brand underline underline-offset-2">01323 846061</a>;

export default function Privacy() {
  return (
    <main id="main">
      <PageHeader title="Privacy Policy" />
      <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl leading-relaxed text-ink">
      <p className="mb-4">Last updated: 6 November 2026</p>
      <p className="mb-4">This policy explains what personal data SLS Fabrications Limited collects through this website, why we collect it, how long we keep it and what your rights are. It follows UK data protection law (UK GDPR and the Data Protection Act 2018) and the Privacy and Electronic Communications Regulations.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Who we are</h2>
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
      <p className="mb-4">ICO registration number: ZC269397</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">What we collect and why</h2>
      <p className="mb-4"><strong>Quote requests.</strong> If you ask for a quote we collect your name, phone number and email address. You can also give us your company name, your location (town or area), when you need the work by, project details, a description of what you are sending and any files you attach. We use this to respond to your request and prepare a quote. We keep it for 12 months after the most recent request you sent us through this website, then delete it, along with any files.</p>
      <p className="mb-4">Records of work we carry out and financial records are kept separately for as long as the law requires.</p>
      <p className="mb-4"><strong>Contact records.</strong> When you send a request we also keep a contact record (your name, email address, phone number and company name) so that we recognise you if you contact us again. We delete it once none of your requests are still kept.</p>
      <p className="mb-4"><strong>Where you found us.</strong> When you ask for a quote or the brochure, we also record the page you were on, the website you came from and any campaign details in the link you used. We use this to see which of our marketing brings in enquiries. We keep it with the request it came with.</p>
      <p className="mb-4"><strong>Brochure requests.</strong> If you ask for our brochure we collect your email address and the time you agreed. We use it to send you the brochure. We rely on your consent, which you give by ticking the box. We keep it for 12 months after we send the brochure, or 12 months after your request if we never sent it, then delete it.</p>
      <p className="mb-4"><strong>Applications to join our team.</strong> If you send us your CV we collect your name, email address and your CV. We use it to consider you for roles, now or in the future. We rely on your consent, which you give by ticking the box. We keep it for 12 months, then delete it.</p>
      <p className="mb-4"><strong>Technical data.</strong> When you use a form, the security check described below handles your IP address and some browser information. We use it only to tell people from automated bots.</p>
      <p className="mb-4"><strong>Your cookie choice.</strong> When you make a choice in our cookie banner, a service called Cookiebot keeps a record of it so we can show that we asked and respect your answer. Cookiebot also receives your IP address when the banner loads. It keeps this data for 12 months.</p>
      <p className="mb-4"><strong>Website analytics.</strong> If you accept analytics cookies, we use Google Analytics to count visits, see which pages are used and how people find us, and to record when someone submits a form or clicks our phone number or email address. We use this to improve the website. We rely on your consent. Analytics data is deleted automatically after 14 months. If you do not accept, no analytics cookies are set and nothing is sent to Google Analytics.</p>
      <p className="mb-4">The website loads Google Tag Manager on every page, so Google receives your IP address and browser details when a page loads, whatever you choose.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Who we share it with</h2>
      <p className="mb-4">We do not sell your personal data. We use these services to run the website, and they handle data on our behalf:</p>
      <ul className="list-disc pl-5 mb-4">
        <li><strong>Supabase</strong> stores form submissions and uploaded files. Our database is hosted in London.</li>
        <li><strong>Cloudflare</strong> hosts this website and provides the security check (Turnstile) on our forms. The check receives your IP address and browser information to tell people from automated bots.</li>
        <li><strong>Google</strong> provides Google Analytics and Google Tag Manager as described above, and the map on our pages, but only if you click to show it. See our Cookie Policy.</li>
        <li><strong>Cookiebot</strong> runs our cookie banner and keeps the record of your choice.</li>
        <li><strong>Microsoft</strong> provides our email, so messages you send to us by email pass through its systems.</li>
      </ul>
      <p className="mb-4">We may also share data if the law requires it.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Where your data goes</h2>
      <p className="mb-4">Our database and stored files are held in the UK (London). Some of the other services we use, including Cloudflare and Google, are run by companies based in the United States and may handle your data outside the UK. Cookiebot stores consent records in the EU, and some of its providers are based in the United States. They explain how they protect transferred data in their own privacy policies.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Your rights</h2>
      <p className="mb-4">You can ask us to:</p>
      <ul className="list-disc pl-5 mb-4">
        <li>see the personal data we hold about you</li>
        <li>correct anything that is wrong</li>
        <li>delete your data</li>
        <li>limit or stop how we use it</li>
        <li>give you a copy of your data in a usable format</li>
      </ul>
      <p className="mb-4">If we rely on your consent, you can withdraw it at any time. This does not affect anything we did before. You can change your cookie choice at any time using the &quot;Cookie settings&quot; link at the bottom of every page.</p>
      <p className="mb-4">To use any of these rights, contact us at {email} or on {phone}.</p>
      <p className="mb-4">If you are unhappy with how we handle your data, you can complain to the Information Commissioner&apos;s Office at ico.org.uk/make-a-complaint. We would appreciate the chance to put things right first.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Changes</h2>
      <p className="mb-4">We may update this policy. The date at the top shows when it last changed.</p>
      </div>
      </div>
    </main>
  );
}
