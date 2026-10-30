import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";

// The contact page is a client component, so its metadata lives here.
export const metadata: Metadata = pageMetadata({
  title: "Contact SLS Fabrications | Hailsham Steel Fabricators",
  description: "Get in touch with SLS Fabrications in Hailsham for a quote, site survey or general enquiry. National and international delivery available.",
  path: "/contact",
});

export default function ContactLayout({ children }: LayoutProps<"/contact">) {
  return children;
}
