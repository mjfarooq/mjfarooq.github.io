# Junaid Farooq — Faculty Website

Personal academic website for Junaid Farooq, Assistant Professor of Electrical &
Computer Engineering at the University of Michigan-Dearborn. Built with
[Astro](https://astro.build), styled in the University of Michigan palette
(Blue #00274C, Maize #FFCB05), and deployed to GitHub Pages.

## Editing content (no HTML required)

All content lives in plain JSON data files under `src/data/`:

- `site.json` — profile, bio, education, appointments, awards, grants, service, social links, research areas, group members
- `publications.json` — every publication (add an entry to add a paper)
- `projects.json` — funded and ongoing projects
- `talks.json` — invited talks and seminars
- `updates.json` — the home page "Recent updates" carousel

### Adding a recent update (LinkedIn-style post)

1. Drop your photos into `public/images/updates/` (any name, e.g. `mobihoc-2025-1.jpg`).
2. Add an entry to the top of `src/data/updates.json`:

```json
{
  "date": "May 2026",
  "message": "One-line description of the post.",
  "images": ["/images/updates/mobihoc-2025-1.jpg", "/images/updates/mobihoc-2025-2.jpg"],
  "link": "https://www.linkedin.com/posts/your-post-url"
}
```

A card shows up to three photos in a tile layout; extra photos appear as a
"+N" chip. `link` is optional and adds a "View post" link.

### Adding a publication

Add an object near the top of `src/data/publications.json`:

```json
{
  "title": "Paper title",
  "authors_str": "X. Wu, J. Farooq, and J. Chen",
  "year": 2026,
  "type": "Journal",
  "venue": "IEEE Transactions on ...",
  "url": "https://doi.org/...",
  "tags": ["O-RAN", "AI / Learning"]
}
```

`type` is one of `Journal`, `Conference`, `Book`, `Book Chapter`, `Thesis`.

## Local preview and deployment

```bash
npm install
npm run dev      # preview at http://localhost:4321
npm run build    # production build into dist/
```

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes the site. In the repo settings, set Pages → Build and deployment →
Source to **GitHub Actions**.
