import type { Metadata } from "next";

// Builds a page's title, description, canonical and social-share tags from one set of values, so they always match.
// A page-level openGraph replaces the site-wide one in Next.js metadata (it is not merged), so every page uses this.
// path is relative; metadataBase in app/layout.tsx turns the canonical and og:url into full addresses.
// No og:image or twitter image until an image is approved.
export function pageMetadata({ title, description, path }: { title: string; description: string; path?: string }): Metadata {
  return {
    title,
    description,
    ...(path && { alternates: { canonical: path } }),
    openGraph: { title, description, ...(path && { url: path }), type: "website", siteName: "SLS Fabrications", locale: "en_GB" },
    twitter: { card: "summary" },
  };
}
