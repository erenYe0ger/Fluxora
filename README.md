# Fluxora

A fast, private, browser-based PDF reader. Import a PDF, read it, search it, highlight text
and drop notes — everything stays in your browser (IndexedDB). There is no backend and no upload.

![status](https://img.shields.io/badge/status-MVP-blue)

## Features

- **Library** — drag & drop or pick PDFs, filter by name, see storage usage, delete.
- **Reader** — continuous scrolling, crisp canvas rendering, real text layer for selection.
- **Zoom** — the page fills the reading width on open (with a gutter either side), then
  zoom in/out, reset to 100%, editable page box, keyboard shortcuts.
- **Search** — case-insensitive, per-document, match counter, next/previous, highlight overlay.
- **Highlights** — select text, pick any colour, translucent so the words stay legible.
- **Notes** — click the page with the note tool, choose a colour per note tool, delete, JSON export.
- **Undo** — `Ctrl/⌘ + Z` (or the toolbar button) reverses the last highlight, note or deletion.
- **Themes** — dark (default) and light, switchable from Settings; the choice is remembered.
- **Responsive** — sidebar collapses to an overlay on narrow screens.

## Quick start (Docker, recommended)

```bash
# dev container, hot reload on http://localhost:5173
docker compose up --build

# production image, nginx on http://localhost:8080
docker compose -f docker-compose.prod.yml up --build
```

## Quick start (local Node)

```bash
npm install
npm run dev        # http://localhost:5173
npm run verify     # typecheck + lint + tests + production build
```

## Why it is local-first

A PDF reader's two real advantages are privacy and latency. Keeping the bytes in IndexedDB means
no upload, no account, no server bill — and opening a 20 MB file feels instant.

The trade-offs are honest: annotations are stored *next to* the file, not inside it, so exporting
them gives you a JSON sidecar (writing into the PDF is planned, see `PLAN.md`). Clearing browser
data deletes the library; re-import the original file and re-attach annotations from the export.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React 19 + TypeScript | Boring, fast, huge ecosystem |
| Build | Vite 8 | Instant dev server, small prod bundle |
| PDF | pdf.js | Only realistic way to get a real text layer in the browser |
| State | Zustand (viewer only) + `useState` | No global store until it earns its place |
| Styling | Tailwind CSS v4 | Utility classes, no CSS drift |
| Storage | IndexedDB (via a 60-line wrapper) | Survives reloads, no dependency needed |
| Tests | Vitest + Testing Library + fake-indexeddb | Fast unit and integration coverage |
| Deploy | nginx in a multi-stage image | Static SPA with SPA fallback + immutable assets |

## Project layout

```
src/
  app/          routing + app shell
  features/
    library/    import, local library, IndexedDB persistence
    viewer/     pdf.js rendering, zoom, navigation, page chrome
    search/     text matching (pure) + search UI
    annotations/highlight & note model, storage, overlays
  shared/       idb, pdf bootstrap, hooks, UI primitives
tests/          setup + cross-feature integration tests
```

Each feature exposes a public `index.ts`; the viewer composes the others through those barrels.
See [AGENTS.md](AGENTS.md) for the working rules and [PLAN.md](PLAN.md) for scope and decisions.

## Branch workflow

`main` is always green and deployable, `dev` receives all work:

```bash
git switch dev
# ...change, test...
npm run verify
git switch main && git merge --no-ff dev && git switch dev
```

## Known limits (MVP)

- Annotations are exported as JSON, not written back into the PDF bytes.
- Scanned PDFs have no text layer, so search finds nothing in them (OCR is out of scope).
- No PDF forms, signatures, redaction, printing, or cloud sync.
- Very large documents (500 MB+) are untested; canvases are rendered only near the viewport.
