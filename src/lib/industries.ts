// Industries page: the 13 sectors, in order. Copy is the consultant's (tile subtitles 2026-10-22, pop-ups
// 2026-10-30): use it word for word. The only change approved by the developer is the full stop at the end of the
// two "Example projects also include" lines. Each tile shows the title and subtitle; the rest is the pop-up
// (src/components/PopupTiles.tsx), which opens from the tile and has its own link, /industries#<slug>.
import type { PopupItem } from "@/components/PopupTiles";

const closing = "Have a requirement in mind?";

export const industries: PopupItem[] = [
  {
    slug: "airport-maintenance",
    title: "Airport Maintenance",
    subtitle: "Fabrication, repairs and modifications for airport infrastructure, ground support equipment and maintenance operations.",
    intro: [
      "SLS Fabrications undertakes metal fabrication, repairs and modifications for equipment and infrastructure used within airport operations.",
      "Our work includes manufacturing replacement components, adapting existing metalwork and producing fabricated assemblies to supplied specifications. We support contractors, equipment suppliers and maintenance providers with manufacturing requirements for both individual components and wider projects.",
    ],
    applications: [
      "Repairs and modifications to ground support equipment",
      "Replacement metal components and assemblies",
      "Fabricated brackets, frames and supports",
      "Alterations to existing equipment and metalwork",
      "Fabrication for airport facilities and infrastructure",
    ],
    closing,
  },
  {
    slug: "waterworks",
    title: "Waterworks",
    subtitle: "Fabricated pipework, replacement components and equipment repairs for wastewater treatment facilities and associated infrastructure.",
    intro: [
      "SLS Fabrications manufactures and repairs metalwork used within wastewater treatment facilities and associated infrastructure.",
      "Our work includes fabricated pipework, replacement components and modifications to existing equipment. We support engineering contractors, equipment suppliers and maintenance teams, with on-site surveying and CAD design available where components need to be measured, reproduced or adapted.",
    ],
    applications: [
      "Fabricated pipework and associated metalwork",
      "Replacement equipment components",
      "Repairs and modifications to existing installations",
      "Brackets, supports and fabricated assemblies",
      "Site measurements for replacement or modification work",
    ],
    afterList: "Example projects also include handrails, platforms, staircases and floor gratings.",
    closing,
  },
  {
    slug: "spas-health-clubs",
    title: "Spas & Health Clubs",
    subtitle: "Metalwork and ventilation for swimming pools, spas, wellness facilities and leisure environments.",
    intro: [
      "SLS Fabrications produces metalwork and ventilation-related fabrications used in swimming pools, spas, health clubs and leisure facilities.",
      "We manufacture components for new installations, refurbishments and existing facilities, working to supplied designs and individual specifications. Our work ranges from fabricated fittings and replacement parts to larger metalwork assemblies, with material selection and finishing considered according to the intended application.",
    ],
    applications: [
      "Metalwork for swimming pools and spa facilities",
      "Ventilation-related fabrications and fittings",
      "Custom frames, supports and brackets",
      "Replacement and modified components",
      "Metalwork for leisure facility installations",
    ],
    afterList: "Example projects also include handrails, ladders and ducting.",
    closing,
  },
  {
    slug: "architectural-metalwork",
    title: "Architectural Metalwork",
    subtitle: "Architectural metalwork for residential and commercial projects, from structural elements to distinctive statement pieces and sculptural installations.",
    intro: [
      "SLS Fabrications manufactures architectural metalwork for residential and commercial projects, from practical structural elements to distinctive statement pieces and sculptural installations.",
      "Working from architectural drawings, design concepts or technical specifications, we produce metalwork where form, proportion and finish are central to the finished result. Our fabrication experience supports individual architectural features and substantial assemblies, whether commissioned directly or as part of a wider building or design project.",
    ],
    applications: [
      "Architectural features and statement installations including staircases, screens and lift shafts",
      "Structural metal elements and fabricated assemblies",
      "Sculptural and decorative metalwork",
      "Custom frames, supports and architectural details",
      "Precision metalwork manufactured to architectural drawings",
    ],
    closing,
  },
  {
    slug: "pumps-pumping-systems",
    title: "Pumps & Pumping Systems",
    subtitle: "Fabrication and welding for pump systems, including supports, guards, shrouds and associated components.",
    intro: [
      "SLS Fabrications manufactures precision metalwork and associated components for pumps and pumping equipment.",
      "Our work includes guards, shrouds, supports and fabricated parts produced to suit existing machinery or supplied specifications. We also undertake modifications and replacement work, with dimensional surveying and CAD drawing support available where parts need to be reproduced or adapted for manufacture.",
    ],
    applications: [
      "Pump guards and protective shrouds",
      "Fabricated supports and mounting components",
      "Welded housings and associated metalwork",
      "Replacement and modified parts",
      "Components for pump equipment assemblies",
    ],
    closing,
  },
  {
    slug: "pharmaceutical-food-production",
    title: "Pharmaceutical & Food Production",
    subtitle: "Stainless steel and aluminium fabrication for laboratories, commercial kitchens and production facilities, including workstations, trolleys, protective covers and site adaptations.",
    intro: [
      "SLS Fabrications manufactures stainless steel and aluminium equipment and components used in laboratories, commercial kitchens and production facilities.",
      "Our work includes workstations, tables, trolleys and protective covers, alongside practical adaptations to existing equipment and premises. We manufacture to supplied specifications and site dimensions, supporting equipment manufacturers, contractors and businesses with individual fabrication requirements.",
    ],
    applications: [
      "Stainless steel workstations and tables",
      "Laboratory and commercial kitchen trolleys",
      "Equipment covers and protective sheeting",
      "Wall cladding, ramps and facility adaptations",
      "Custom components for production and processing areas",
    ],
    closing,
  },
  {
    slug: "exhibitions-events",
    title: "Exhibitions & Events",
    subtitle: "Custom metal structures, display frameworks and fabricated features for exhibitions, events and installations.",
    intro: [
      "SLS Fabrications produces custom metal structures, display frameworks and fabricated features for exhibitions, events and installations.",
      "Working from design drawings and project specifications, we manufacture metalwork for exhibition contractors, display manufacturers and designers. This includes individual features, supporting frameworks and larger assemblies, with consideration given to dimensions, assembly and the required finish.",
    ],
    applications: [
      "Exhibition display frameworks",
      "Custom metal structures and assemblies",
      "Decorative features and installations",
      "Fabricated supports and mounting elements",
      "Metalwork for event and exhibition displays",
    ],
    closing,
  },
  {
    slug: "building-services-cladding",
    title: "Building Services & Cladding",
    subtitle: "Building metalwork for residential and commercial projects, including façade panels, fascias, copings, guttering, staircases, balustrades and railings.",
    intro: [
      "SLS Fabrications manufactures metalwork for residential and commercial buildings, including façade details, roofline elements and associated construction components.",
      "Our work covers fascias, trims, copings, guttering and pipe covers, alongside staircases, balustrades and railings. We manufacture to project drawings and site-specific dimensions, supporting building contractors, cladding specialists and other customers requiring individual components or fabricated assemblies.",
    ],
    applications: [
      "Façade fascias, trims and cladding details",
      "Copings and custom guttering",
      "Pipe covers and fabricated service components",
      "Staircases, balustrades and railings",
      "Brackets, supports and associated building metalwork",
    ],
    closing,
  },
  {
    slug: "office-restaurant-fit-outs",
    title: "Office & Restaurant Fit-Outs",
    subtitle: "Bespoke metalwork for commercial interiors, including statement bar tops, banquette seating, decorative screens, feature wall panelling and custom fittings.",
    intro: [
      "SLS Fabrications produces custom metalwork for offices, restaurants and hospitality interiors, combining practical fabrication with the finish required for prominent interior features.",
      "Our work includes bar tops, banquette seating elements, host stations, decorative screens and wall panelling. We manufacture to design drawings and individual specifications, supplying metalwork for standalone features and larger fit-out projects undertaken by contractors, designers and commercial operators.",
    ],
    applications: [
      "Metal bar tops and counter features",
      "Banquette seating frames and elements",
      "Host stations, tables and tabletops",
      "Decorative screens and feature wall panelling",
      "Custom curtain rails and interior fittings",
    ],
    closing,
  },
  {
    slug: "automotive-specialist-vehicles",
    title: "Automotive & Specialist Vehicles",
    subtitle: "Automotive fabrication spanning precision components, aluminium fuel tanks, custom vehicle fit-outs, racking and pet enclosures, as well as alloy wheel repairs.",
    intro: [
      "SLS Fabrications undertakes automotive metal fabrication, welding and repairs for private, commercial and specialist vehicles.",
      "Our work ranges from precision components, replacement parts and aluminium fuel tanks to custom vehicle fit-outs, racking and pet enclosures. We also carry out alloy wheel repairs and manufacture metalwork for vehicle adaptations, including campervans and mobile catering vehicles.",
    ],
    applications: [
      "Precision automotive components and replacement parts",
      "Aluminium fuel tanks",
      "Custom vehicle fit-outs and modifications",
      "Racking, pet enclosures and specialist fittings",
      "Alloy wheel repairs",
    ],
    closing,
  },
  {
    slug: "defence-security",
    title: "Defence & Security",
    subtitle: "Fabricated components for defence and security applications, including test and measurement equipment, copper components, equipment housings and storage systems.",
    intro: [
      "SLS Fabrications manufactures metal components and fabricated equipment used in defence and security-related applications.",
      "Our work includes components for test and measurement equipment, specialist copper metalwork, equipment housings and storage systems. We manufacture to supplied drawings and technical specifications, supporting customers requiring individual parts, modifications and fabricated assemblies for specialist equipment.",
    ],
    applications: [
      "Components for test and measurement equipment",
      "Specialist copper metalwork",
      "Fabricated equipment housings and covers",
      "Storage and racking systems",
      "Brackets, supports and technical assemblies",
    ],
    closing,
  },
  {
    slug: "commercial-signage",
    title: "Commercial Signage",
    subtitle: "Building and transport signage, including architectural lettering, totem signs, wayfinding structures, sign housings and mounting systems.",
    intro: [
      "SLS Fabrications manufactures metalwork used in commercial building signage, architectural lettering and transport wayfinding installations.",
      "Our work includes fabricated lettering, totem sign structures, housings and mounting systems. We supply metal components and frameworks to project drawings, supporting signage manufacturers, contractors and designers with fabrication and finishing requirements for a range of installations.",
    ],
    applications: [
      "Architectural building lettering",
      "Totem sign structures and frames",
      "Transport and airport wayfinding metalwork",
      "Sign housings and protective covers",
      "Mounting brackets and supporting frameworks",
    ],
    closing,
  },
  {
    slug: "garden-landscaping",
    title: "Garden & Landscaping",
    subtitle: "Metalwork for gardens and landscaped spaces, including planters, wall cladding, arches, gates, fencing, balustrades and statement installations.",
    intro: [
      "SLS Fabrications produces metalwork for residential gardens, commercial landscapes and garden show installations.",
      "Our work includes architectural planters, wall cladding, arches, gates and fencing, alongside sculptural features and statement pieces. Working from individual designs and specified dimensions, we manufacture components and installations for private commissions, landscape designers and contractors.",
    ],
    applications: [
      "Architectural planters and metal garden features",
      "Gates, fencing and balustrades",
      "Decorative arches and garden structures",
      "Exterior wall cladding and fabricated details",
      "Sculptural pieces and garden show installations",
    ],
    closing,
  },
];
