import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Cookie Policy | SLS Fabrications",
  alternates: { canonical: "/cookies" },
};

const email = <a href="mailto:info@slsfabrications.com" className="text-brand underline underline-offset-2">info@slsfabrications.com</a>;
const phone = <a href="tel:01323846061" className="text-brand underline underline-offset-2">01323 846061</a>;

export default function Cookies() {
  return (
    <main id="main">
      <PageHeader title="Cookie Policy" />
      <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl leading-relaxed text-ink">
      <p className="mb-4">Last updated: 8 October 2026</p>
      <p className="mb-4">Cookies are small files that a website saves on your device. This policy explains what this website does.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Our own cookies</h2>
      <p className="mb-4">
        This website does not set any cookies of its own, and does not store information in your browser, when you read the pages or use the forms. We do not use analytics or advertising cookies at the moment. If we start using them, we will update this page and ask for your permission first where the law requires it.
      </p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Services from other companies</h2>
      <p className="mb-4">Two services on this website may set their own cookies or store information in your browser:</p>
      <ul className="list-disc pl-5 mb-4">
        <li>
          <strong>Cloudflare Turnstile</strong> is the security check on our forms. It tells people from automated bots, and protects our forms from spam. It loads on the Projects and Careers pages, and when you open the quote form on the Contact page. It is run by Cloudflare under its own privacy policy.
        </li>
        <li>
          <strong>Google Maps</strong> shows our location. It only loads when you click &quot;Show map&quot;. Once it loads, Google can store information such as cookies on your device, under Google&apos;s own privacy policy.
        </li>
      </ul>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Controlling cookies</h2>
      <p className="mb-4">
        You can block or delete cookies in your browser settings. If you block the Turnstile check, our forms may not work, and you can call us on {phone} or email {email} instead.
      </p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Contact</h2>
      <p className="mb-4">If you have questions about this policy, contact {email} or call {phone}.</p>
      </div>
      </div>
    </main>
  );
}
