# Endless Canon contributor guide

Follow Wildan's global GitHub workflow. This is a Vite + TypeScript application with no server, account system, analytics, audio samples or runtime API keys. Aurora optionally lazy-loads Three.js; other scenes use Canvas 2D.

## Commands

- `npm ci` — locked dependencies (Node 20.19+; CI uses Node 22).
- `npm run dev` — local listener at `http://127.0.0.1:5173`.
- `npm run check` — ESLint, Vitest, TypeScript and production build.
- `npm run preview` — inspect the production bundle locally.

## Invariants

- A phrase is **16 beats / 4 bars / 64 sixteenth-note ticks**. The source plan's 2-bar wording is inconsistent with its eight two-beat chords. Echoes are delayed by one and two complete four-bar cycles.
- `src/music` is pure and deterministic. Classic and Lo-fi have separate v1 phrase snapshots; a missing `style` parameter remains Classic, with drums/vinyl off. Version 1 share URLs depend on PRNG and composition behavior; do not silently change the v1 snapshots. Preserve a versioned engine or explicitly migrate links when changing the algorithm.
- Audio owns timing. Schedule against `AudioContext.currentTime`, not animation frames. Visual events are bounded (256), the phrase cache is bounded (12), and active audio nodes must disconnect on end.
- Style, key, mood or density changes fade out, restart the current variation at silence, then fade in. Keep the transition gate separate from mixer/master automation; rapid edits coalesce to the latest settings. Density changes commit on `change`, not every drag event.
- Audio starts only after a user gesture. Pause suspends the context and timer. Handle OS/browser interruptions without claiming audio is still playing.
- Scene changes blend from the currently visible frame; paused scenes stop drawing when the blend ends. Keep the canvas static under `prefers-reduced-motion`, and hidden chrome in Zen inert. Use `ui/motion.ts` for non-blocking change feedback and native-dialog exits.
- Keep fonts and art local; retain bundled font licenses. Document license and provenance before adding sample packs.
- Never insert seed, URL or local-storage text using `innerHTML`. Settings are validated; favorites use `textContent`.

- Lo-fi swing lengthens the first eighth and shortens the second equally; never change a bar length. Initialize layer gains at zero so disabled instruments cannot leak during startup.
- `visuals/living.ts` uses fixed environmental geometry; keep its drawing independent of composition/audio scheduling. Freeze scene time on pause, and keep reduced-motion rendering static.

## Verification

Read `DESIGN.md` before substantial visual work. Verify desktop/mobile in a real browser, including long accidental chord labels, all scene palettes, native dialogs, first play, pause, shared sessions and reduced motion. Temporary evidence goes in ignored `output/playwright/`; curated screenshots in `docs/images/`.

Do not conflate deterministic stress tests with real-time endurance, measured audio with human listening, or a successful build with deployment. See `docs/verification.md` for coverage and remaining limits.

## Deployment

GitHub Pages uses `.github/workflows/pages.yml`, publishing only `dist/` after `npm run check` passes. The initial publishing branch is `codex/1-endless-canon`; `main` is configured for after merge. Remove the temporary branch trigger once merged. Keep Pages permissions scoped to the deploy job; do not add repository secrets. Preserve Vite relative base paths so fonts, the worker and share links work at `/canon-endless/`. Deployment authorization does not authorize merging PRs.

## Aurora renderer and water notes

- `Landscape` owns the only visual RAF. `AuroraWorld` must take scene time as input, never read wall time to animate, and release geometries, materials, its Reflector target and WebGL context on disposal.
- Keep GPU initialization optional and generation-guarded. Context/shader failure must preserve the 2D scene and audio. Never make the main UI depend on successful WebGL loading.
- Water gestures are ephemeral and bounded to one pending note; schedule using the actual future chord on an unscheduled eighth. Route through melody/master/recording and keep v1 phrase snapshots unchanged.
- Validate both renderer modes, lost/unavailable WebGL, delayed import/scene races, pause/reduced-motion pixel equality, compact/expanded mobile controls, keyboard water notes and Zen exit. Do not claim CPU render timing is GPU FPS.
