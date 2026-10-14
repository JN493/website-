// Structured data for search engines (schema.org LocalBusiness), rendered once in app/layout.tsx.
// Only verified facts from this repo. Do not add coordinates, social links, services,
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
  // Matches the footer: Mon to Fri, 7:30am to 5:00pm.
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "07:30",
    closes: "17:00",
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
