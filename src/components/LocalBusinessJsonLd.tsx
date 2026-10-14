// Structured data for search engines (schema.org LocalBusiness), rendered once in app/layout.tsx.
// Only verified facts from this repo. Do not add opening hours, coordinates, social links, services,
// ratings, price range, email or logo without checking them first.
// The address is the workshop (where customers go), not the registered office.
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SLS Fabrications",
  legalName: "SLS FABRICATIONS LIMITED",
  url: "https://slsfabrications.com",
  telephone: "+44 1323 846061",
  identifier: {
    "@type": "PropertyValue",
    propertyID: "Companies House company number",
    value: "03187824",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Unit 2 Hythe Works, Diplocks Way",
    addressLocality: "Hailsham",
    addressRegion: "East Sussex",
    postalCode: "BN27 3JF",
    addressCountry: "GB",
  },
};

export default function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      // A data block, not executed by the browser. "<" is escaped so the JSON can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }}
    />
  );
}
