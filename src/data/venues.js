// Maps a raw venue string to a canonical venue family.
//
// Venue strings in publications.json carry year, location, volume and page detail
// ("in IEEE ICC 2025, Denver CO, USA"), so grouping on the raw string splits one
// venue across every year it appears. These rules collapse those into one family
// so the "Browse by venue" breakdown counts IEEE ICC once with 4 papers rather
// than as three separate one-paper venues.
//
// Order matters: the first matching pattern wins. Put workshop-specific patterns
// before their parent conference, otherwise an ICC workshop is absorbed into ICC.

const RULES = [
  // Workshops first — these are distinct venues that name a parent conference.
  [/Cyber Resilience Workshop/i, "IEEE CNS Cyber Resilience Workshop (CRW)"],
  [/\bNGResNet\b|Resilience in Next[- ]Generation Network/i, "NGResNet Workshop"],
  [/FutureG/i, "NDSS FutureG Workshop"],
  [/Critical National Infrastructures/i, "CCNI Workshop"],
  [/Security and Privacy Workshops/i, "IEEE SPW"],
  [/ML-Spec/i, "IEEE DySPAN ML-Spec Workshop"],

  // Conferences.
  [/Global Communications Conference|\bGlobecom\b/i, "IEEE Globecom"],
  [/\bICC\b/i, "IEEE ICC"],
  [/\bINFOCOM\b/i, "IEEE INFOCOM"],
  [/\bVTC\b|Vehicular Technology Conference/i, "IEEE VTC"],
  [/\bWCNC\b/i, "IEEE WCNC"],
  [/\bNOMS\b/i, "IEEE/IFIP NOMS"],
  [/\bCOINS\b/i, "IEEE COINS"],
  [/\bWiOpt\b|Modeling and Optimization in Mobile/i, "WiOpt"],
  [/\bMobiHoc\b/i, "ACM MobiHoc"],
  [/\bMILCOM\b/i, "IEEE MILCOM"],
  [/\bBigData\b|Big Data/i, "IEEE BigData"],
  [/\bMASS\b/i, "IEEE MASS"],
  [/\bCloudNet\b/i, "IEEE CloudNet"],
  [/\bCVPR\b/i, "IEEE/CVF CVPR"],
  [/\bDySPAN\b/i, "IEEE DySPAN"],
  [/\bPIMRC\b|Personal, Indoor and Mobile Radio/i, "IEEE PIMRC"],
  [/World Forum on Internet of Things/i, "IEEE WF-IoT"],
  [/Decision and Game Theory/i, "GameSec"],
  [/Computer Communications and Networks/i, "ICCCN"],
  [/Local Computer Networks/i, "IEEE LCN"],
  [/American Control Conference/i, "American Control Conference"],
  [/Resilience Week/i, "Resilience Week"],
  [/\bCNS\b/i, "IEEE CNS"],
];

/**
 * Canonical family name for a venue string.
 * Falls back to trimming the year, location, volume and page tail off the raw string.
 */
export function venueFamily(venue) {
  const raw = String(venue || "").trim();
  if (!raw) return "";

  const s = raw.replace(/^in\s+/i, "").replace(/^Proc\.\s*/i, "");
  for (const [pattern, name] of RULES) {
    if (pattern.test(s)) return name;
  }

  // No rule matched (most journals): strip the bibliographic tail.
  return s
    .split(/,\s*(?:vol\.|no\.|pp\.)/)[0]      // "…, vol. 25, no. 2, pp. 1-9"
    .replace(/\s*\([^)]*\d{4}[^)]*\)/g, "")   // "… (Globecom 2026)"
    .split(",")[0]                             // "…, Macau, China"
    .replace(/^\d{4}\s+/, "")                  // "2020 IEEE …"
    .replace(/\s*\d{4}$/, "")                  // "… 2025"
    .replace(/\s*\d+(?:st|nd|rd|th)\s*$/i, "")
    .trim();
}

/**
 * Ranked venue families for one publication type.
 * Returns [{ name, count, slug }] sorted by count desc, then name.
 */
export function venueBreakdown(pubs, type) {
  const counts = new Map();
  for (const p of pubs) {
    if (p.type !== type) continue;
    const name = venueFamily(p.venue);
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count, slug: venueSlug(name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Stable id for a family, used as the data attribute the click filter matches on. */
export function venueSlug(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
