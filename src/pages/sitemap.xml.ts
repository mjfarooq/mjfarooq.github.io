import type { APIRoute } from "astro";

const origin = "https://mjfarooq.github.io";
const routes = ["", "about", "research", "publications", "teaching", "group", "news"];

export const GET: APIRoute = () => {
  const today = new Date().toISOString().split("T")[0];
  const urls = routes.map((r) => {
    const loc = `${origin}/${r ? r + "/" : ""}`;
    const priority = r === "" ? "1.0" : "0.8";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
