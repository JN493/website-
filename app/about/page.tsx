import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About SLS Fabrications | Hailsham, East Sussex",
  description: "Meet the team behind SLS Fabrications, skilled welders and fabricators delivering precision work from our Hailsham workshop.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return <main className="p-6"><h1 className="text-3xl font-bold">About</h1></main>;
}
