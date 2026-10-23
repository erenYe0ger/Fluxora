# Fluxora — Plan

## Vision

A fast, private, browser-based PDF reader: open a PDF, read it comfortably, find text quickly,
and leave annotations that persist — without uploading anything anywhere.

## MVP scope (v0.1) — shipping in this repo

| # | Capability | Notes |
| --- | --- | --- |
| 1 | Import PDFs (picker + drag & drop) | Validated locally, stored in IndexedDB |
| 2 | Library screen | List, search by filename, open, delete, storage usage |
| 3 | Reader | Continuous vertical scroll, crisp canvas render, text layer for selection |
| 4 | Zoom & fit | Zoom in/out, fit width, reset to 100%, keyboard shortcuts |
| 5 | Navigation | Thumbnail rail, page box, prev/next, jump-to-page from search |
| 6 | Text search | Case-insensitive, match counter, next/prev, highlight all matches |
| 7 | Annotations | Text highlight (4 colours), sticky notes, delete, per-document persistence |
| 8 | Responsive shell | Usable down to tablet width; mobile shows a single-pane reader |

### Explicitly out of scope for MVP

- Writing annotations back into the PDF bytes (export/import of a sidecar JSON only).
- Form filling, signatures, redaction, OCR, printing, cloud sync, collaboration, accounts.
- Server-side rendering or any network upload. Fluxora is local-first by design.

## Architecture

```
Browser
├─ React app (Vite + TS)
│   ├─ app shell / routing
│   ├─ features: library · viewer · search · annotations
│   └─ shared: idb · pdf bootstrap · ui primitives · hooks
├─ pdf.js (worker) ──> canvas + text layer
└─ IndexedDB ──> "documents" (bytes, meta) · "annotations" (per document)

Docker
├─ Dockerfile (prod) ──> multi-stage build ──> nginx:alpine serving /dist on :80
├─ Dockerfile.dev ─────> node:24-alpine, vite dev server on :5173
└─ compose files ──────> dev (:5173) + prod (:8080)
```

### Key decisions

1. **No backend.** A PDF reader's value is privacy and latency; a server would add both cost and risk.
   IndexedDB holds the original bytes so the library survives reloads.
2. **pdf.js for rendering.** Mozilla's engine is the only realistic way to get text layers, correct
   fonts, and worker-based parsing in a browser. Rendered as canvas + selectable text layer.
3. **Store bytes, not derived data.** Thumbnails/canvases are regenerated on demand; only the file
   and annotation model are persisted. Avoids cache-invalidation bugs.
4. **Annotations are a sidecar model**, normalised to page-relative coordinates (`0..1`) so they
   survive zoom and re-render. Exportable as JSON; writing into the PDF is deferred.
5. **Feature-sliced folders** so each capability can grow (e.g. sharing) without a rewrite.
6. **Two-stage container** so dev (HMR, bind mounts) and prod (static, gzip, immutable caching)
   stay separate images from the start.

## Milestones

| Milestone | Content | Status |
| --- | --- | --- |
| M0 | Repo, branch workflow, docs, container skeleton | ✅ done |
| M1 | Import + library persistence | ✅ done |
| M2 | Reader: render, scroll, zoom, navigation | ✅ done |
| M3 | Search + annotations | ✅ done |
| M4 | Test suite + verify pipeline + prod image | ✅ done |
| M5 | Themed UI, settings, custom highlight colours, fit-page fix | ✅ done |

### v0.2 implementation notes

- **Theme is a token swap, not `dark:` overrides.** Every colour is a CSS custom property
  (`--surface`, `--ink`, `--accent`, …) mapped into Tailwind through `@theme inline`, and
  `<html data-theme>` selects the palette. Dark is the default; `index.html` applies the saved
  theme before first paint so a light-mode user never sees a dark flash.
- **Settings live in `features/settings`** (Zustand + `persist`) and hold only preferences
  (theme, default highlight colour, recent custom colours). Documents stay in IndexedDB.
- **Colours are free-form.** Annotations store a hex string, so presets are just defaults and a
  custom colour is not a special case anywhere in the data model.
- **"Fit" means fit-page, not fit-width.** `fitPageScale` takes the smaller of the two axis
  ratios, so the page always fits the viewport with the scroll padding free on all four sides and
  nothing is cropped.
- **pdf.js text spans need size from CSS.** pdf.js 6 positions spans by percentage and publishes
  `--font-height`; the span `font-size` must be `var(--total-scale-factor) * var(--font-height)`.
  Without that rule the invisible spans keep the browser default size and every selection and
  highlight box lands on the wrong glyphs. `src/styles/index.css` owns this contract — do not
  "simplify" it away.
- **Highlights never capture pointer events.** They are a visual layer only; blocking them keeps
  text selection working over already-highlighted text. Deletion happens from the Notes panel or
  the new annotation's own controls.

### v0.1 implementation notes

- **Search text has two sources.** Match counting uses `getTextContent()` (fast, whole document);
  the on-page highlight boxes come from the rendered DOM text layer, because only the browser
  knows where each run actually lands. On complex layouts the two can drift by a fraction of a
  line, which is why the counter and the highlight are treated as separate concerns.
- **Annotations outlive zoom but not the document.** Highlights store page-relative rects, so they
  re-render at any scale. Deleting a document cascades to its annotations (`deleteDocument`).
- **Rendering is viewport-driven.** A page only builds canvas + text layer once it is within
  600 px of the viewport (`useInView`), which keeps memory flat while scrolling long files.
- **Fit width is layout state, manual zoom is user state.** `applyScale` (layout) and `setScale`
  (user) are separate store actions so resizing the window does not cancel a manual zoom.
- **Container images were not exercised here.** Both compose files validate with
  `docker compose config`; building/running requires Docker Desktop to be started.

## Deferred (next, not now)

- Persist annotations into the PDF via `pdf-lib` and download the annotated file.
- Text selection handles, freehand ink, rectangle/shape annotations.
- Per-document highlight palettes (today the default colour is global) and annotation tags/colours
  in the sidebar.
- A true dark reading surface that inverts the PDF page itself (today the page stays white).
- Password-protected PDFs, PDF/A edge cases, very large (500MB+) documents.
- Virtualised page rendering for 1000+ page files.
- PWA/offline install, file-system-access API for "open in place".
- Playwright end-to-end suite in CI (needs a browser download; kept out of MVP install).

## Risks

- **Memory:** large PDFs plus retained canvases can exhaust mobile memory → render only visible
  pages, cache a small window of canvases, destroy off-screen ones.
- **Text layer accuracy:** search relies on pdf.js text items; scanned PDFs have no text layer
  (search returns zero results) — surfaced as a hint in the UI, OCR is out of scope.
- **Browser storage eviction:** IndexedDB may be cleared; library warns and allows re-import.
