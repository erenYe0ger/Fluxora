# AGENTS.md — Fluxora

Operational guide for anyone (human or AI agent) changing this codebase.

## What Fluxora is

A browser-first PDF reader: open a PDF from your device, read it, search it, annotate it.
There is **no backend**. Every document stays in the browser (IndexedDB) and never leaves
the machine. The Docker images therefore exist to *serve the static client*, not to run a server API.

## Non-negotiable constraints

1. **Client-only.** Do not add a server API, database, or upload endpoint without updating `PLAN.md` first.
2. **Local-first storage.** Documents and annotations live in IndexedDB. Never send file bytes to a network.
3. **Containerised from day one.** `docker compose up` (dev) and `docker compose -f docker-compose.prod.yml up` (prod) must both work after any change.
4. **Budget the bundle.** PDF rendering is already heavy; do not add libraries for what 30 lines of code can do.
5. **Comments explain intent, not mechanics.** Comment *why* / *what stage of the pipeline this is*. Do not narrate every line.

## Branch workflow (enforced by habit, not tooling)

```
main   ← always green, always deployable. Receives merges only.
  ↑
 dev   ← active work. All commits land here first.
```

1. `git switch dev` before making changes.
2. Make the change in small, reviewable commits.
3. Verify: `npm run verify` (typecheck + lint + unit/integration tests) and, for UI work, a manual pass.
4. Merge only when green:
   ```bash
   git switch main
   git merge --no-ff dev -m "release: <summary>"
   git switch dev
   ```
5. Never commit directly to `main`. Never force-push `main`.

### Remote

`origin` is <https://github.com/erenYe0ger/Fluxora>, and **only `main` is published**. `dev` and any
scratch branch stay on this machine. `remote.origin.push` is pinned to
`refs/heads/main:refs/heads/main`, so a bare `git push` cannot publish `dev` by accident; only an
explicit refspec (`git push origin dev:dev`) would, and there is no reason to want that.

Promoting work therefore looks like: merge `dev` into `main` locally, check `main`, then `git push`
(which sends `main` and nothing else).

**Definition of done for a feature:** code + tests + docs touched (if behaviour changed) + `npm run verify` passes + manual smoke test of the touched screen.

## Folder structure

Feature-sliced: each feature owns its UI, state and logic. Shared code is generic and feature-agnostic.

```
src/
  app/          App shell, routing, providers. No business logic.
  features/
    library/    Document import + local library (IndexedDB persistence, list UI)
    viewer/     PDF loading, canvas/text rendering, page nav, zoom
    search/     In-document text search (pure matching logic + UI glue)
    annotations/ Highlight & note model, storage, overlay rendering
    settings/   Theme + tool colour preferences (localStorage, cross-cutting)
  shared/
    lib/        Framework-free helpers: idb wrapper, pdf.js bootstrap, formatting
    ui/         Dumb, reusable primitives (Button, IconButton, EmptyState, icons, ...)
    hooks/      Reusable React hooks with no feature knowledge
  styles/       Design tokens (light/dark palettes), Tailwind entry, pdf.js layer CSS
tests/          Test setup, fixtures, fakes shared by test suites
```

Dependency rule: `features/* → shared/*` and `app → features`. `shared/` never imports from
`features/` or `app/`.

A feature may read another feature only through its public barrel (`features/x/index.ts`).
`viewer` is the composition surface: it is the only feature allowed to import `annotations`
and `search`, and it imports them exactly as the barrels export them. `settings` is
cross-cutting: any screen may render `<SettingsMenu />` or read `useSettingsStore`. Anything
that stops being "one feature's concern" moves down to `shared/` instead.

## Styling rules

1. **Use design tokens, never raw palette classes.** Colours come from `--bg`, `--surface`,
   `--surface-2`, `--elevated`, `--line`, `--line-strong`, `--ink`, `--muted`, `--accent`,
   `--accent-soft`, `--danger` exposed as `bg-surface`, `text-muted`, `border-line`, … A new
   colour means a new token in both palettes, not a one-off hex in a component.
2. **Never introduce `dark:` variants for chrome.** The palette swap already handles themes;
   `dark:` is reserved for cases where dark mode needs a *different* design, not a different colour.
3. **Animation is opt-in and short.** Use the `animate-fade-up` / `animate-pop` / `animate-slide-in`
   utilities (150–450 ms, ease-out). Respect `prefers-reduced-motion`, which is handled globally.
4. **`src/styles/index.css` owns two contracts** that are easy to break and expensive to debug:
   the token map, and the pdf.js `.textLayer` sizing rules (see `PLAN.md`). Do not restyle them
   "for tidiness" — verify text selection still lines up if you touch the text layer.
5. **Highlights stay translucent.** `.annotation-highlight` uses opacity + multiply so the marked
   text remains readable. A solid `background-color` with no alpha is a bug, not a style choice.
6. **Canvases render at device pixels.** Anything drawn to a canvas (page, thumbnail) sizes its
   backing store to `cssSize * devicePixelRatio` and lets CSS scale it down. Skipping this is what
   makes previews look hazy on high-density displays.

## Naming conventions

- Components: `PascalCase.tsx`, one component per file, same name as file.
- Hooks: `useThing.ts`.
- Pure logic: `thing.ts` next to its tests (`thing.test.ts`).
- Types: `types.ts` inside the feature that owns them.
- Test files sit beside the unit under test; cross-feature integration tests go in `tests/integration/`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 (host, hot reload) |
| `npm run verify` | typecheck → lint → test → build (the gate before merging) |
| `npm test` | Vitest (unit + integration) |
| `npm run build` | Production bundle into `dist/` |
| `docker compose up` | Dev container with HMR on :5173 |
| `docker compose -f docker-compose.prod.yml up --build` | Prod image (nginx) on :8080 |

## Code conventions

- TypeScript `strict`; no `any` in new code — use `unknown` + narrowing.
- State: local `useState` first, Zustand only for state shared across the feature boundary.
- Keep rendering side effects (canvas, pdf.js) inside hooks (`usePdfDocument`, `usePageRender`), never inside JSX.
- pdf.js objects are **not** React state; keep them in refs/effects and expose plain data to components.
- Every user-visible failure gets an inline, actionable message — no silent `catch {}`.
- Interactive elements need keyboard access and an accessible label.
- **Annotation colour pickers live next to the tool that uses them**, not in the settings dialog.
  Settings keeps the theme; the chosen colours are still stored there so they survive a reload.
- **Undo history is session state** (`useAnnotations`). It is intentionally not persisted: an undo
  must never resurrect or remove something from a previous visit to the document.
- **Derive transient state, do not store it.** If a UI state can be computed from existing state
  (e.g. `searching = query !== settledQuery`), compute it. A boolean set inside an effect paints one
  stale frame before it lands, which is how "no results" flashes before "searching".
- **Keep effect dependencies honest.** If a hook takes a callback it calls later, hold it in a ref
  rather than putting it in the effect's dependency list — an inline arrow from a caller would then
  re-run (and, in the search hook, loop) on every render.
- **Tool cursors mirror the toolbar icon.** `markerCursor`/`selectCursor` must draw the same paths
  as `HighlighterIcon`/`CursorIcon`, and the text layer inherits the page cursor in tool modes so the
  I-beam never replaces them. If an icon changes, its cursor changes with it.
- **Anything the user drops on a page stays inside that page.** Note composers and note popovers are
  clamped/flipped against the page rect, and drag positions are measured against live bounds.

## Testing expectations

- Anything with branching logic (search matching, annotation geometry, storage CRUD) gets a unit test.
- Anything that crosses layers (import → library → viewer) gets an integration test.
- Tests must not need network or a real PDF file: use `pdf-lib`-free fixtures, plain byte stubs, or fake-indexeddb.

## Known issues

**Windows + Vite 8 `spawn EPERM`**
Vite 8 uses rolldown's `externalize-deps` plugin, which can fail on Windows with `EPERM: spawn
EPERM` when resolving config dependencies. If `npm run verify` fails on Windows with this error,
the fix is to nuke and reinstall:

```bash
rmdir /s /q node_modules
del package-lock.json
npm install
npm run verify
```

This project is pinned to **Vite 7 + `@vitejs/plugin-react@5`** to avoid this issue. Keep those
versions together: any upgrade to Vite 8 requires verifying the Windows build independently.

## When in doubt

Prefer the smallest change that keeps the app usable, document the trade-off in `PLAN.md` under
"Deferred", and leave the code easier to read than you found it.
