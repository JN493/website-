import type { Metadata } from "next";
import CareersForm from "@/components/CareersForm";

export const metadata: Metadata = {
  title: "Careers | SLS Fabrications, Hailsham",
  description: "Join the SLS Fabrications team in Hailsham. We have no set vacancies at the moment, but send us your CV if you'd like to work with us.",
  alternates: { canonical: "/careers" },
};

export default function Careers() {
  return (
    <main className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Join Our Team</h1>
      <p className="text-gray-600 mb-6">
        We currently don&apos;t have any specific job openings, but if you feel you can make a difference, please submit your CV and we&apos;ll be in touch if a suitable role comes up.
      </p>
      <CareersForm />
    </main>
  );
}
