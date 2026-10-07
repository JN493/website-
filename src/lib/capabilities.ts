// To add a photo: put the file in public/images/capabilities/<slug>.jpg and set
// image to "/images/capabilities/<slug>.jpg". Set ready to true only once the
// detail page (/capabilities/<slug>) has real content; that also makes the tile clickable.

export type Capability = {
  slug: string;
  title: string;
  description: string;
  image?: string;
  ready: boolean;
};

export const capabilities: Capability[] = [
  {
    slug: "on-site-surveying",
    title: "On-Site Surveying",
    description: "We are available to assess your site in person before work begins, to ensure accuracy and reduce costly surprises later in the project.",
    image: undefined,
    ready: false,
  },
  {
    slug: "cad-design",
    title: "CAD Design",
    description: "Your project could start with our precise digital design, letting us plan, adjust, and confirm specifications with you before a single piece of steel is cut.",
    image: undefined,
    ready: false,
  },
  {
    slug: "laser-cutting",
    title: "Laser Cutting",
    description: "Accurate laser cutting to give your project clean, precise profiles from the start.",
    image: undefined,
    ready: false,
  },
  {
    slug: "punching",
    title: "Punching",
    description: "Accurate punching across a wide range of hole types and sizes, suited to both one-off pieces and larger production runs.",
    image: undefined,
    ready: false,
  },
  {
    slug: "folding",
    title: "Folding",
    description: "Precision folding to shape steel into the exact profiles your project requires, from structural components to detailed brackets. This is one of our strongest capabilities.",
    image: undefined,
    ready: false,
  },
  {
    slug: "rolling",
    title: "Rolling",
    description: "Precision rolling for projects that need curved or cylindrical steel sections.",
    image: undefined,
    ready: false,
  },
  {
    slug: "tube-bending",
    title: "Tube Bending",
    description: "Custom tube bending for projects requiring precise angles, without compromising structural integrity.",
    image: undefined,
    ready: false,
  },
  {
    slug: "cnc-machining",
    title: "CNC Machining",
    description: "Precision CNC machining for components that need tight, repeatable accuracy.",
    image: undefined,
    ready: false,
  },
  {
    slug: "welding",
    title: "Welding",
    description: "Skilled welding across a range of materials, built to the standard your project and your industry demand. This is the core of what we do, and every other capability supports it.",
    image: undefined,
    ready: false,
  },
  {
    slug: "finishing",
    title: "Finishing",
    description: "A range of finishing options to protect and present your finished product, from a polished surface finish to galvanisation for long-term corrosion resistance. Polishing, galvanisation and chemical oxidation are all available.",
    image: undefined,
    ready: false,
  },
  {
    slug: "powder-coating",
    title: "Powder Coating",
    description: "A durable, even powder-coated finish to protect your finished product and give it a professional look.",
    image: undefined,
    ready: false,
  },
  {
    slug: "delivery",
    title: "Delivery",
    description: "National and international delivery available, so your finished fabrication reaches you wherever your project is based.",
    image: undefined,
    ready: false,
  },
];
