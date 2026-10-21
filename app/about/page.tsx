import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About SLS Fabrications | Hailsham, East Sussex",
  description: "Meet the team behind SLS Fabrications, skilled welders and fabricators delivering precision work from our Hailsham workshop.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <main id="main">
      <PageHeader title="About" />
    </main>
  );
}
