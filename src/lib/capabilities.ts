// Capabilities page: the 12 services, in order. Copy is the consultant's (2026-10-22): use it word for word.
// Each tile shows the title and subtitle; the rest is the pop-up (src/components/CapabilityTiles.tsx),
// which opens from the tile and has its own link, /capabilities#<slug>.
// To add a photo: put the file in public/images/capabilities/<slug>.jpg and set image to "/images/capabilities/<slug>.jpg".

export type Capability = {
  slug: string;
  title: string;
  subtitle: string; // tile text
  intro: string[]; // pop-up paragraphs
  applications: string[]; // "Applications include:" list
  closing: string; // pop-up closing heading
  closingText?: string; // extra closing paragraph (only some services)
  image?: string;
};

export const capabilities: Capability[] = [
  {
    slug: "surveying",
    title: "Surveying",
    subtitle: "On-site measurements, dimensional verification and site assessments for manufacture and installation.",
    intro: [
      "SLS Fabrications provides on-site dimensional surveying to establish accurate information for design, manufacture and installation.",
      "We assess existing site conditions, verify critical dimensions and identify practical considerations, including access, positioning and integration with surrounding structures or equipment. Where required, we can also review existing CAD drawings or develop new drawings to support manufacture.",
    ],
    applications: [
      "On-site measurements and dimensional verification",
      "Surveys for fabrication, installation and site modifications",
      "Assessment of existing structures and equipment",
      "Replacement or modification of existing components",
      "Review and development of CAD drawings",
    ],
    closing: "Have a requirement in mind?",
    closingText: "Whether you have detailed specifications or are exploring the options, our team is available to discuss your requirements and the next steps.",
  },
  {
    slug: "cad-design",
    title: "CAD Design",
    subtitle: "2D technical drawings, 3D modelling and design development for manufacture.",
    intro: [
      "SLS Fabrications provides 2D technical drawings, 3D CAD modelling and design development services.",
      "Using initial concepts, sketches, existing drawings or technical specifications, we develop detailed designs with consideration for dimensions, material selection, component compatibility and manufacturing requirements.",
    ],
    applications: [
      "2D technical drawings and manufacturing documentation",
      "3D CAD modelling and component assemblies",
      "Development of initial concepts and customer sketches",
      "Review and refinement of existing drawings",
      "Design development for bespoke fabrication and manufacture",
    ],
    closing: "Have a design in mind or need technical guidance?",
    closingText: "Whether you have a fully developed specification, an existing drawing or an initial concept, our team is available to discuss your requirements and the next steps.",
  },
  {
    slug: "welding",
    title: "Welding",
    subtitle: "Skilled TIG, MIG and gas welding for bespoke metalwork, precision components and fabricated assemblies.",
    intro: [
      "At the core of SLS Fabrications is our extensive welding expertise, delivering high-quality workmanship for bespoke fabrications, precision components and specialist applications using TIG, MIG and gas welding processes.",
      "From intricate, one-off components to substantial welded assemblies, we undertake a diverse range of work, combining established techniques with practical problem-solving to produce metalwork that meets the demands of each specification.",
    ],
    applications: [
      "TIG, MIG and gas welding",
      "Bespoke metalwork and welded assemblies",
      "Precision components, brackets, frames and supports",
      "Modifications and repairs to existing metalwork",
      "Welding for industrial, architectural and commercial applications",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "folding",
    title: "Folding",
    subtitle: "Press brake folding for bespoke profiles, formed panels and sheet metal components.",
    intro: [
      "SLS Fabrications provides precision sheet metal folding using press brake machinery.",
      "From straightforward bends to intricate, multi-fold components, we work to technical drawings and individual specifications.",
      "Our folding service accommodates one-off components and larger production runs, with further fabrication and finishing available where required.",
    ],
    applications: [
      "Press brake folding and sheet metal forming",
      "Bespoke angles, channels and folded profiles",
      "Panels, covers, trays and enclosures",
      "Brackets, supports and mounting components",
      "Complex components requiring multiple bends",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "rolling",
    title: "Rolling",
    subtitle: "Sheet and section rolling for curved profiles, cylindrical forms and fabricated metalwork.",
    intro: [
      "SLS Fabrications provides sheet and section metal rolling to produce curved profiles, cylindrical forms and bespoke components.",
      "Working to specified radii and dimensions, we undertake forming for individual parts and larger projects, with welding and finishing available for work requiring further manufacture.",
    ],
    applications: [
      "Sheet metal and section rolling",
      "Curved profiles and cylindrical forms",
      "Bespoke rolled sections and components",
      "Architectural and decorative metalwork",
      "Formed sections for frames and welded assemblies",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "punching",
    title: "Punching",
    subtitle: "Sheet metal punching for accurate holes, slots, cut-outs and repeatable patterns.",
    intro: [
      "SLS Fabrications provides sheet metal punching to produce accurately positioned holes, slots, cut-outs and bespoke component profiles.",
      "Our service accommodates intricate patterns and repeatable features, including individual parts and larger production runs. Punched metalwork can also be supplied for subsequent folding, welding or finishing.",
    ],
    applications: [
      "Sheet metal punching and profiling",
      "Holes, slots and bespoke cut-outs",
      "Perforated panels and ventilation openings",
      "Brackets, mounting plates and fixing points",
      "Components requiring repeated patterns and detailed profiles",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "tube-bending",
    title: "Tube Bending",
    subtitle: "Metal tube bending for curved sections, frames and custom tubular components.",
    intro: [
      "SLS Fabrications provides metal tube bending to specified dimensions, bend radii and profiles.",
      "Our services cover curved and formed tubular components for frames, supports, engineered equipment and architectural metalwork, with additional welding and finishing available where required.",
    ],
    applications: [
      "Curved tubing and bespoke profiles",
      "Frames, handrails and support structures",
      "Architectural and decorative metalwork",
      "Tubular components for specialist machinery and equipment",
      "Custom-formed sections for welded fabrications",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "laser-cutting",
    title: "Laser Cutting",
    subtitle: "CNC laser profiling of sheet and plate for bespoke shapes, parts and detailed cut-outs.",
    intro: [
      "SLS Fabrications coordinates CNC laser cutting through our established manufacturing partners, producing accurately profiled sheet and plate metal to technical drawings and specifications.",
      "The service covers bespoke shapes, detailed cut-outs and repeat production parts. Laser-cut material can be supplied as individual components or incorporated into subsequent forming, welding and assembly work.",
    ],
    applications: [
      "CNC laser profiling of sheet and plate",
      "Bespoke shapes and intricate cut-outs",
      "Brackets, mounting plates and fixing components",
      "Panels, covers and equipment housings",
      "Profile-cut parts for subsequent fabrication and assembly",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "cnc-machining",
    title: "CNC Machining",
    subtitle: "CNC milling and turning for machined components, mechanical fittings and engineered parts.",
    intro: [
      "SLS Fabrications coordinates CNC machining through our established manufacturing partners, including milling and turning for parts produced to specified dimensions and tolerances.",
      "The service covers bespoke machined components, mechanical fittings and parts requiring accurately manufactured interfaces or detailed features. Machining can be arranged independently or alongside SLS fabrication work.",
    ],
    applications: [
      "CNC milling and turning",
      "Bespoke machined parts and mechanical components",
      "Shafts, bushes, spacers and fittings",
      "Machined mounting and connection features",
      "Components for specialist equipment and fabricated assemblies",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "powder-coating",
    title: "Powder Coating",
    subtitle: "Protective and decorative powder-coated finishes in a range of colours and textures.",
    intro: [
      "SLS Fabrications coordinates powder coating through our established finishing partners, offering protective and decorative finishes in a range of colours, textures and specifications.",
      "Coating requirements are considered in relation to the material, intended application and operating environment. This service is available for suitable individual components or as part of a wider manufacturing project.",
    ],
    applications: [
      "Powder coating of fabricated metalwork",
      "RAL colour-matched finishes",
      "Smooth, textured and decorative coatings",
      "Architectural panels, frames and fittings",
      "Protective finishes for suitable internal and external applications",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "finishing",
    title: "Finishing",
    subtitle: "Electropolishing, galvanising, chemical blackening, toning and surface treatments.",
    intro: [
      "SLS Fabrications provides access to a range of metal finishing and surface treatments, including electropolishing, galvanising, chemical blackening and toning.",
      "We accommodate functional and decorative finishes according to material suitability, required surface appearance and intended use. Treatments can be arranged for individual items or incorporated into the manufacture of completed metalwork.",
    ],
    applications: [
      "Electropolishing of stainless-steel components",
      "Galvanising for corrosion protection",
      "Chemical blackening and oxide treatments",
      "Metal toning and decorative finishes",
      "Specialist surface treatments for industrial and architectural metalwork",
    ],
    closing: "Have a requirement in mind?",
  },
  {
    slug: "delivery",
    title: "Delivery",
    subtitle: "UK and international delivery of finished metalwork, components and fabricated structures.",
    intro: [
      "SLS Fabrications coordinates national and international delivery of manufactured components, finished metalwork and fabricated structures.",
      "Transport is arranged according to the dimensions, weight, handling requirements and destination of each consignment. This includes larger or non-standard items requiring suitable loading, transportation and delivery arrangements.",
    ],
    applications: [
      "Nationwide delivery throughout the UK",
      "International transport and freight coordination",
      "Collection and delivery of finished fabrications",
      "Transport of large or non-standard components",
      "Delivery scheduling and logistics coordination",
    ],
    closing: "Have a requirement in mind?",
  },
];
