import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t px-6 py-10 text-sm text-gray-600 mt-20">
      <p>SLS Fabrications — Unit 2 Diplocks Way, Hailsham, East Sussex</p>
      <p className="mt-1">Tel: 01323 846061</p>
      <p className="mt-1">Mon–Fri: 7:30am – 5:00pm</p>
      <div className="mt-4">
        <iframe
          title="SLS Fabrications location"
          src="https://www.google.com/maps?q=Unit+2+Diplocks+Way,+Hailsham,+East+Sussex&output=embed"
          width="100%" height="200" style={{ border: 0 }} loading="lazy"
        ></iframe>
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
