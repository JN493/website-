import type { Metadata } from "next";

// The contact page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Contact SLS Fabrications | Hailsham Steel Fabricators",
  description: "Get in touch with SLS Fabrications in Hailsham for a quote, site survey or general enquiry. National and international delivery available.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: LayoutProps<"/contact">) {
  return children;
}
