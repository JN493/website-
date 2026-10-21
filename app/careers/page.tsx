import type { Metadata } from "next";
import CareersForm from "@/components/CareersForm";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Careers | SLS Fabrications, Hailsham",
  description: "Join the SLS Fabrications team in Hailsham. We have no set vacancies at the moment, but send us your CV if you'd like to work with us.",
  alternates: { canonical: "/careers" },
};

export default function Careers() {
  return (
    <main id="main">
      <PageHeader title="Join Our Team">
        <p>
        We currently don&apos;t have any specific job openings, but if you feel you can make a difference, please submit your CV and we&apos;ll be in touch if a suitable role comes up.
        </p>
      </PageHeader>
      <div className="container-page py-12 sm:py-16">
        <div className="card max-w-2xl">
          <CareersForm />
        </div>
      </div>
    </main>
  );
}
