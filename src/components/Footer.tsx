import Link from "next/link";
import MapEmbed from "@/components/MapEmbed";
import CookieSettingsButton from "@/components/CookieSettingsButton";

const address = "Unit 2 Hythe Works, Diplocks Way, Hailsham BN27 3JF, United Kingdom";
const mapsQuery = encodeURIComponent(address); // used by the embedded map only
// The company's Google Maps listing ("SLS Fabrications Ltd", Unit 2 Hythe Works). A short link, so it is for links only:
// it cannot load inside a frame, and the CSP frame-src only allows https://www.google.com.
const mapsListing = "https://maps.app.goo.gl/p2S2dNHEghqHfYA49";

// Footer map size. Width applies from lg (1024px) up, where the map is the right-hand column;
// below that it stacks under the other columns at full width, up to 400px.
const mapSize = { "--map-w": "280px", "--map-h": "180px" } as React.CSSProperties;

export default function Footer() {
  return (
    // Dark blue: .on-dark gives a white focus ring (globals.css). Secondary text is white at 80% (7.47:1).
    <footer className="on-dark mt-24 bg-brand text-sm text-white/80" style={mapSize}>
      <div className="container-page py-12">
      <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_var(--map-w)]">
        <div>
          <h2 className="mb-3 text-base font-semibold text-white">Find Us</h2>
          <address className="not-italic">
            SLS Fabrications<br />
            Unit 2 Hythe Works, Diplocks Way<br />
            Hailsham BN27 3JF<br />
            United Kingdom
          </address>
          <a
            href={mapsListing}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block py-2 -mb-2 text-white underline underline-offset-4 hover:no-underline"
          >
            Get directions<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold text-white">Call Us</h2>
          <a href="tel:+441323846061" className="inline-block py-2 -my-2 text-white underline underline-offset-4 hover:no-underline">01323 846061</a>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold text-white">Opening Hours</h2>
          <p>Mon–Fri: 7:30am – 5:00pm</p>
        </div>
        <div className="h-[var(--map-h)] w-full max-w-[400px] sm:col-span-3 lg:col-span-1 lg:max-w-none">
          <MapEmbed
            title="Map showing SLS Fabrications location"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
          />
        </div>
      </div>
      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-4 border-t border-white/20 pt-6">
        <Link href="/privacy" className="py-2 -my-2 hover:text-white hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="py-2 -my-2 hover:text-white hover:underline">Terms of Use</Link>
        <Link href="/cookies" className="py-2 -my-2 hover:text-white hover:underline">Cookie Policy</Link>
        <CookieSettingsButton />
      </div>
      {/* Last row: copyright flush left, decorative logo bottom right (ml-auto keeps it right if the row wraps). */}
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <p>&copy; 2026 SLS Fabrications</p>
        {/* Lazy: it is at the bottom of the page, and React only preloads non-lazy images (the preload went unused). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, images are unoptimised anyway */}
        <img src="/images/logo/logo-white.png" srcSet="/images/logo/logo-white@2x.png 2x" width={102} height={52} alt="" loading="lazy" className="ml-auto" />
      </div>
      </div>
    </footer>
  );
}
