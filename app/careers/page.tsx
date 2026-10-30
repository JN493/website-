import type { Metadata } from "next";
import CareersForm from "@/components/CareersForm";
import PageHeader from "@/components/PageHeader";
import JumpToSection from "@/components/JumpToSection";

export const metadata: Metadata = {
  title: "Careers | SLS Fabrications, Hailsham",
  description: "Join the SLS Fabrications team in Hailsham. We have no set vacancies at the moment, but send us your CV if you'd like to work with us.",
  alternates: { canonical: "/careers" },
};

// Copy approved 2026-10-30 (word for word; "talented people who strive" approved by the developer; the Welding &
// Fabrication paragraph starts at "Welders" to avoid repeating "We're always interested", developer 2026-10-30).
// One readable column (70ch). No images, cards or mailto links on this page.
const areas = [
  {
    title: "Welding & Fabrication",
    text: "Welders and fabricators who set the standard. People with an instinctive eye for detail, a natural talent for solving problems and a level of skill and pride in their craft that's evident in everything they produce. If that sounds like you, you'll be in good company.",
  },
  {
    title: "Design & Technical",
    text: "For those who see beyond the drawing. We value sharp technical minds who understand how things are made, challenge conventional thinking and recognise the potential of emerging technologies. People who connect the workshop with the wider business, combining creative thinking, practical engineering and the ingenuity to turn complex ideas into exceptional work.",
  },
  {
    title: "Operations & Leadership",
    text: "We're drawn to natural leaders with sharp commercial instincts, a talent for bringing out the best in people and the credibility and confidence to make a real impact. People who stay ahead of industry developments and know how to combine insight, data and experience to recognise opportunities, make smart decisions and deliver exceptional results. If that's your mindset, there's a place for you at SLS.",
  },
];

export default function Careers() {
  return (
    <main id="main">
      <PageHeader title="Join Our Team">
        <p>Exceptional Work by Exceptional People.</p>
      </PageHeader>
      <div className="container-page py-12 sm:py-16">
        <div className="max-w-[70ch]">
          <div className="space-y-5 text-lg leading-relaxed text-ink">
            <p>Great fabrication takes experience, ingenuity, sharp judgement and talented people who strive to deliver outstanding work.</p>
            <p>
              At SLS Fabrications, we&apos;re proud of our team and work, bringing serious skills, fresh thinking and individual expertise together, with a shared determination to never settle for ordinary.
            </p>
            <p>
              We&apos;re always interested in meeting people who share our standards and values. People who take ownership, back one another and have the ambition to keep raising the bar.
            </p>
            <p>Sound like your kind of team? We&apos;d love to hear from you.</p>
          </div>
          <JumpToSection target="apply" focusId="apply-heading" className="btn btn-primary mt-8">
            Get in touch
          </JumpToSection>

          <p className="mt-16 text-lg leading-relaxed text-ink">
            We&apos;re always interested in connecting with exceptional people across the following areas.
          </p>
          {areas.map((area) => (
            <section key={area.title} className="mt-14">
              <h2 className="accent-line-top text-2xl font-bold tracking-tight text-brand">{area.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink">{area.text}</p>
            </section>
          ))}

          {/* The form section. "Get in touch" jumps here and focuses the heading (tabIndex -1). */}
          <section id="apply" aria-labelledby="apply-heading" className="mt-20">
            <h2 id="apply-heading" tabIndex={-1} className="text-2xl font-bold tracking-tight text-brand">
              Let&apos;s talk
            </h2>
            <div className="mt-6">
              <CareersForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
