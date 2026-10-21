import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SiteTracking from "@/components/SiteTracking";
import LocalBusinessJsonLd from "@/components/LocalBusinessJsonLd";

// Self-hosted: next/font downloads Inter at build time and serves it from /_next/static (font-src 'self').
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://slsfabrications.com"),
  title: "SLS Fabrications | Steel Welding & Fabrication in Hailsham",
  description: "Steel fabrication, welding, folding and finishing from our Hailsham, East Sussex workshop.",
};

// Google Consent Mode defaults, as given in Cookiebot's article: everything denied except security_storage.
const consentDefaults = `window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments)
}
gtag("consent", "default", {
  ad_personalization: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
  wait_for_update: 500
});
gtag("set", "ads_data_redaction", true);`;

// Google Tag Manager container GTM-M995FM9J (no <noscript> iframe fallback).
const tagManager = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M995FM9J');`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} h-full antialiased`}
    >
      {/* Order matters (Cookiebot, "Google Tag Manager and Automatic cookie blocking"): Consent Mode defaults,
          then Tag Manager, then Cookiebot. Cookiebot is in manual mode (no data-blockingmode="auto"). */}
      <head>
        <script data-cookieconsent="ignore" dangerouslySetInnerHTML={{ __html: consentDefaults }} />
        <script data-cookieconsent="ignore" dangerouslySetInnerHTML={{ __html: tagManager }} />
        {/* Synchronous on purpose, as in Cookiebot's article, so it runs before the page's own scripts. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="fbd2a6ae-76e6-4170-bb8d-46ced9c918cf"
          type="text/javascript"
        />
      </head>
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
