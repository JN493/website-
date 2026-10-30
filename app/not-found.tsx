import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { pageMetadata } from "@/lib/pageMetadata";

// No path: the 404 page has no canonical or og:url (Next.js adds noindex).
export const metadata: Metadata = pageMetadata({
  title: "Page not found | SLS Fabrications",
  description: "The page you're looking for doesn't exist or has moved.",
});

export default function NotFound() {
  return (
    <main id="main">
      <PageHeader title="Page not found">
        <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      </PageHeader>
      <div className="container-page flex flex-wrap gap-4 py-12 sm:py-16">
        <Link href="/" className="btn btn-primary">Back to home</Link>
        <Link href="/contact" className="btn btn-secondary">Contact us</Link>
      </div>
    </main>
  );
}
