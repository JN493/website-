const capabilities = [
  ["Welding", "Skilled welding across a range of materials, built to the standard your project and your industry demand. This is the core of what we do, and every other capability supports it."],
  ["Folding", "Precision folding to shape steel into the exact profiles your project requires, from structural components to detailed brackets. This is one of our strongest capabilities."],
  ["Rolling", "Precision rolling for projects that need curved or cylindrical steel sections."],
  ["On-Site Surveying", "We are available to assess your site in person before work begins, to ensure accuracy and reduce costly surprises later in the project."],
  ["CAD Design", "Your project could start with our precise digital design, letting us plan, adjust, and confirm specifications with you before a single piece of steel is cut."],
  ["Punching", "Accurate punching across a wide range of hole types and sizes, suited to both one-off pieces and larger production runs."],
  ["Tube Bending", "Custom tube bending for projects requiring precise angles, without compromising structural integrity."],
  ["Finishing — Polishing, Galvanisation & Chemical Oxidation", "A range of finishing options to protect and present your finished product, from a polished surface finish to galvanisation for long-term corrosion resistance."],
  ["Partner Services — Laser Cutting, CNC Machining & Powder Coating", "Through trusted partners, we extend our in-house capability with laser cutting, CNC machining, and powder coating, giving you a complete solution without managing multiple suppliers yourself."],
  ["Delivery", "National and international delivery available, so your finished fabrication reaches you wherever your project is based."],
];

export default function Capabilities() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Capabilities</h1>
      {capabilities.map(([title, text]) => (
        <div key={title} className="mt-6 pt-4 border-t">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-gray-600 text-sm mt-1">{text}</p>
        </div>
      ))}
    </main>
  );
}
