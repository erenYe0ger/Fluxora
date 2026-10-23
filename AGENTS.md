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
  shared/
    lib/        Framework-free helpers: idb wrapper, pdf.js bootstrap, formatting
    ui/         Dumb, reusable primitives (Button, IconButton, EmptyState, ...)
    hooks/      Reusable React hooks with no feature knowledge
  styles/       Global CSS + Tailwind entry
tests/          Test setup, fixtures, fakes shared by test suites
```

Dependency rule: `features/* → shared/*` and `app → features`. `shared/` never imports from
`features/` or `app/`.

A feature may read another feature only through its public barrel (`features/x/index.ts`).
`viewer` is the composition surface: it is the only feature allowed to import `annotations`
and `search`, and it imports them exactly as the barrels export them. Anything that stops
being "one feature's concern" moves down to `shared/` instead.

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

## Testing expectations

- Anything with branching logic (search matching, annotation geometry, storage CRUD) gets a unit test.
- Anything that crosses layers (import → library → viewer) gets an integration test.
- Tests must not need network or a real PDF file: use `pdf-lib`-free fixtures, plain byte stubs, or fake-indexeddb.

## When in doubt

Prefer the smallest change that keeps the app usable, document the trade-off in `PLAN.md` under
"Deferred", and leave the code easier to read than you found it.
