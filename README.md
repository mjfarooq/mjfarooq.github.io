# Junaid Farooq — Faculty Website

Personal academic website for Junaid Farooq, Assistant Professor of Electrical &
Computer Engineering at the University of Michigan-Dearborn. Built with
[Astro](https://astro.build) and deployed to GitHub Pages.

## Editing content

All site content lives in plain JSON data files. No HTML editing required.

- `src/data/site.json` — profile, bio, education, social links, research areas
- `src/data/publications.json` — every publication (add a new entry to add a paper)
- `src/data/projects.json` — funded projects

### Adding a publication

Open `src/data/publications.json` and add an object like this near the top:

```json
{
  "title": "Your Paper Title",
  "authors": ["Junaid Farooq", "Co Author"],
  "year": 2026,
  "type": "Journal",
  "venue": "IEEE Transactions on ...",
  "venue_short": "",
  "doi": "10.1109/XXXX",
  "doi_url": "https://doi.org/10.1109/XXXX",
  "abstract": "Optional abstract text.",
  "tags": ["NextG", "Security"]
}
```

`type` can be `Journal`, `Conference`, `Book`, or `Preprint`.

## Local development

```bash
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
```

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the
Astro site and publishes it to GitHub Pages automatically. In the repository
settings, set Pages → Build and deployment → Source to **GitHub Actions**.
