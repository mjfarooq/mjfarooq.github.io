# CV source

LaTeX source for the CV that the site links to at `/cv.pdf`.

## Build

```sh
cd cv
pdflatex -interaction=nonstopmode cv.tex
pdflatex -interaction=nonstopmode cv.tex   # second pass for \pageref{LastPage}
cp cv.pdf ../public/cv.pdf
```

Two `pdflatex` passes are needed so the "Page N of M" footer resolves. The
compiled `cv.pdf` in this folder is a working copy; the deployed copy is
`../public/cv.pdf`, which Astro serves at `/cv.pdf` on the built site.

## When updating

After editing `cv.tex`, rebuild and copy the PDF to `public/`. The site's
sidebar and about page both link to `/cv.pdf` via `site.json`'s `cvUrl`
field.
