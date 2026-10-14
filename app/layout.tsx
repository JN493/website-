import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SiteTracking from "@/components/SiteTracking";
import LocalBusinessJsonLd from "@/components/LocalBusinessJsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://slsfabrications.com"),
  title: "SLS Fabrications | Steel Welding & Fabrication in Hailsham",
  description: "Steel fabrication, welding, folding and finishing from our Hailsham, East Sussex workshop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* First focusable element on every page; hidden until focused. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:border focus:text-sm"
        >
          Skip to content
        </a>
        <Nav />
        {children}
        <Footer />
        <SiteTracking />
        <LocalBusinessJsonLd />
      </body>
    </html>
  );
}
