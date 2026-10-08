import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const pages = ["", "/about", "/capabilities", "/industries", "/projects", "/contact", "/privacy", "/terms", "/cookies"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({ url: `https://slsfabrications.com${path}` }));
}
