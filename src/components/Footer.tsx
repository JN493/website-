import Link from "next/link";
import MapEmbed from "@/components/MapEmbed";

const address = "Unit 2 Hythe Works, Diplocks Way, Hailsham BN27 3JF, United Kingdom";
const mapsQuery = encodeURIComponent(address);

export default function Footer() {
  return (
    <footer className="border-t px-6 py-10 text-sm text-gray-600 mt-20">
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">Find Us</h2>
          <address className="not-italic">
            SLS Fabrications<br />
            Unit 2 Hythe Works, Diplocks Way<br />
            Hailsham BN27 3JF<br />
            United Kingdom
          </address>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 underline"
          >
            Get directions
          </a>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">Call Us</h2>
          <a href="tel:+441323846061" className="underline">01323 846061</a>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">Opening Hours</h2>
          <p>Mon–Fri: 7:30am – 5:00pm</p>
        </div>
      </div>
      <div className="mt-6">
        <MapEmbed
          title="Map showing SLS Fabrications location"
          src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
        />
      </div>
      <div className="flex gap-4 mt-4">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Use</Link>
        <Link href="/cookies">Cookie Policy</Link>
      </div>
      <p className="mt-4">&copy; 2026 SLS Fabrications</p>
    </footer>
  );
}
