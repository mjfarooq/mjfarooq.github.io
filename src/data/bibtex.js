// Generate a BibTeX entry from a publication object.
const TYPE_MAP = {
  "Journal": "article",
  "Conference": "inproceedings",
  "Book": "book",
  "Book Chapter": "incollection",
};

const clean = (s) => (s || "").replace(/\*/g, "");

export function bibtexKey(p) {
  const firstAuthor = clean((p.authors && p.authors[0]) || "anon");
  const surname = firstAuthor.trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, "");
  const titleClean = (p.title || "").replace(/^(Ph\.D\.|M\.S\.|B\.S\.) Thesis:\s*/, "");
  const firstWord = (titleClean.split(/\s+/).find((w) => w.length > 3) || "paper").toLowerCase().replace(/[^a-z]/g, "");
  return `${surname}${p.year}${firstWord}`;
}

export function bibtex(p) {
  let type = TYPE_MAP[p.type] || "misc";
  if (p.type === "Thesis") {
    type = (p.title || "").startsWith("Ph.D.") ? "phdthesis" : "mastersthesis";
  }
  const title = (p.title || "").replace(/^(Ph\.D\.|M\.S\.|B\.S\.) Thesis:\s*/, "");
  const authors = (p.authors || []).map(clean).map((a) => a.trim()).filter(Boolean).join(" and ");
  const key = bibtexKey(p);
  const venue = (p.venue || "").replace(/^in\s+/i, "").replace(/^submitted to\s+/i, "");
  const lines = [`@${type}{${key},`];
  if (authors) lines.push(`  author = {${authors}},`);
  if (title) lines.push(`  title = {${title}},`);
  if (p.type === "Journal" && venue) lines.push(`  journal = {${venue}},`);
  else if (p.type === "Conference" && venue) lines.push(`  booktitle = {${venue}},`);
  else if ((p.type === "Book" || p.type === "Book Chapter") && venue) lines.push(`  publisher = {${venue}},`);
  else if (p.type === "Thesis" && venue) lines.push(`  school = {${venue}},`);
  if (p.year) lines.push(`  year = {${p.year}},`);
  if (p.url) lines.push(`  url = {${p.url}},`);
  lines.push(`}`);
  return lines.join("\n");
}
