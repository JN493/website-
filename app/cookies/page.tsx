import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Cookie Policy | SLS Fabrications",
  description: "How this website uses cookies and how to change your cookie choices.",
  path: "/cookies",
});

const email = <a href="mailto:info@slsfabrications.com" className="text-brand underline underline-offset-2">info@slsfabrications.com</a>;
const phone = <a href="tel:01323846061" className="text-brand underline underline-offset-2">01323 846061</a>;

export default function Cookies() {
  return (
    <main id="main">
      <PageHeader title="Cookie Policy" />
      <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl leading-relaxed text-ink">
      <p className="mb-4">Last updated: 6 November 2026</p>
      <p className="mb-4">Cookies are small files that a website saves on your device. This policy explains what this website does.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Your choice</h2>
      <p className="mb-4">When you first visit, a banner asks whether to allow cookies. You can accept or reject, and the website works fully either way. You can change your mind at any time using the &quot;Cookie settings&quot; link at the bottom of every page.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Cookies on this website</h2>
      <div className="mb-4 overflow-x-auto" role="region" aria-label="Cookies used on this website" tabIndex={0}>
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead><tr><th scope="col" className="border border-line bg-tint px-3 py-2 text-left font-semibold">Cookie</th><th scope="col" className="border border-line bg-tint px-3 py-2 text-left font-semibold">Set by</th><th scope="col" className="border border-line bg-tint px-3 py-2 text-left font-semibold">What it does</th><th scope="col" className="border border-line bg-tint px-3 py-2 text-left font-semibold">Lasts</th><th scope="col" className="border border-line bg-tint px-3 py-2 text-left font-semibold">Needs your consent?</th></tr></thead>
        <tbody>
          <tr><td className="border border-line px-3 py-2 align-top">CookieConsent</td><td className="border border-line px-3 py-2 align-top">Cookiebot</td><td className="border border-line px-3 py-2 align-top">Remembers your cookie choice</td><td className="border border-line px-3 py-2 align-top">12 months</td><td className="border border-line px-3 py-2 align-top">No, it only stores your choice</td></tr>
          <tr><td className="border border-line px-3 py-2 align-top">_ga</td><td className="border border-line px-3 py-2 align-top">Google Analytics</td><td className="border border-line px-3 py-2 align-top">Tells visitors apart so we can count them</td><td className="border border-line px-3 py-2 align-top">Up to 2 years (some browsers shorten this)</td><td className="border border-line px-3 py-2 align-top">Yes</td></tr>
          <tr><td className="border border-line px-3 py-2 align-top">_ga_24P1P65D2S</td><td className="border border-line px-3 py-2 align-top">Google Analytics</td><td className="border border-line px-3 py-2 align-top">Keeps track of a visit</td><td className="border border-line px-3 py-2 align-top">Up to 2 years (some browsers shorten this)</td><td className="border border-line px-3 py-2 align-top">Yes</td></tr>
        </tbody>
      </table>
      </div>
      <p className="mb-4">Analytics cookies are only set if you accept them. If you reject them, none are set.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Our own cookies</h2>
      <p className="mb-4">Apart from the cookie that remembers your choice, this website does not set cookies of its own, and does not store other information in your browser, when you read the pages or use the forms.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Analytics</h2>
      <p className="mb-4">If you accept, we use Google Analytics to count visits, see which pages are used and how people find us, and to record when someone submits a form or clicks our phone number or email address. We use this to improve the website. Our Privacy Policy explains how long we keep this data.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Services from other companies</h2>
      <p className="mb-4">These services are run by other companies under their own privacy policies:</p>
      <ul className="list-disc pl-5 mb-4">
        <li><strong>Cookiebot</strong> shows the cookie banner and keeps a record of your choice.</li>
        <li><strong>Google Tag Manager</strong> loads on every page and manages our analytics tags. Google receives your IP address when it loads. It does not set analytics cookies unless you accept.</li>
        <li><strong>Cloudflare Turnstile</strong> is the security check on our forms. It tells people from automated bots, and protects our forms from spam. It loads on the Projects and Careers pages, and when you open the quote form on the Contact page. It may set its own cookies or store information in your browser.</li>
        <li><strong>Google Maps</strong> shows our location. It only loads when you click &quot;Show map&quot;. Once it loads, Google can store information such as cookies on your device.</li>
      </ul>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Controlling cookies</h2>
      <p className="mb-4">You can block or delete cookies in your browser settings. If you block the Turnstile check, our forms may not work, and you can call us on {phone} or email {email} instead.</p>

      <h2 className="accent-line mt-10 mb-3 text-xl font-semibold text-brand">Contact</h2>
      <p className="mb-4">If you have questions about this policy, contact {email} or call {phone}.</p>
      </div>
      </div>
    </main>
  );
}
