# Verification — 2026-10-03

## Automated checks

`npm run check` passed: ESLint, strict TypeScript, **36 Vitest tests**, Vite production build.

- Major/minor progressions and transposition across seven keys.
- Chord membership on strong beats, scale/range, positive duration and 64-tick coverage across 7 keys × 3 moods × 3 movement levels × 48 cycles.
- Determinism, v1 snapshots, predominantly stepwise motion, seeking directly to cycle 1,000,000.
- Voice entrances, exact delayed echoes, rest with two voices, stage durations across 30 epochs.
- Cache ≤12 entries across 10,000 simulated cycles with changing settings.
- Complete URL round trips, invalid/prototype/empty parameters, preset isolation, corrupt/blocked storage, favorite cap.
- Nine transport regressions: delayed tonal commit, coalesced rapid edits, live mix isolation, uncommitted density isolation, silent changes without autoplay, pause/resume, browser interruption, retargeted tempo glide and rewind target preservation.

`npm audit` reported **0 vulnerabilities** after selecting patched Vitest. This is a dated audit result, not a permanent guarantee.

## Browser checks

Chromium via Playwright CLI against the local app:

| Check              | Result                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| No autoplay        | Context uninitialized until Play                                               |
| Play/pause/resume  | Real audio output; pause suspends context and freezes ticks                    |
| Master mute        | Analyser RMS = 0                                                               |
| Mixer              | Melody-only, custom toggle and full-ensemble work                              |
| Key/mood/rewind    | E-flat minor applied; rewind moves one whole variation                         |
| Six scenes         | Selected, rendered and screenshots inspected                                   |
| Share fallback     | Clipboard denial yields copyable URL; seed/settings/cycle retained             |
| Favorites          | Saved and persisted across reload                                              |
| Recording          | 21 KB WebM downloaded; ffprobe: Opus, 48 kHz, stereo                           |
| Zen/keyboard       | Hidden controls inert; Escape restores; Space toggles audio                    |
| Reduced motion     | Canvas byte-identical over 800 ms with audio running                           |
| Responsive         | 1440×900, 768×844, 390×844, 320×844; no horizontal overflow; mobile mixer fits |
| Runtime exceptions | None in completed interaction run                                              |

The first visual pass found a missing mobile Share accessible name, cramped accidental-chord labels, narrow slider hit areas and forest trees behind the heading. These were corrected. A temporary development font-import error was also fixed before final checks.

The final production preview also passed playback and automatic scene rotation checks, including opening a shared link exactly on a rotation boundary. No failed requests or runtime exceptions occurred. Axe reported **0 violations** for WCAG 2 A/AA and 2.1 AA rules in the checked desktop lake/forest/aurora/rain states, scene picker, mixer, About, mobile lake and mobile mixer. This is automated coverage of those states, not a full accessibility certification. Status and shortcut labels now sit inside the opaque player surface to preserve contrast across landscapes.

## Web Audio rendering

Three 12-second stereo `OfflineAudioContext` renders using the production synthesizer and three voices:

| Configuration                  | Peak absolute sample |      RMS | Clipped / nonfinite |
| ------------------------------ | -------------------: | -------: | ------------------: |
| Normal ensemble, master 100%   |             0.237419 | 0.043489 |               0 / 0 |
| Muted master                   |                    0 |        0 |               0 / 0 |
| All layers 100%, high movement |             0.339578 | 0.078120 |               0 / 0 |

These establish signal generation, mute and absence of digital clipping in these renders, not subjective quality or hardware loudness safety.

## Smooth setting transitions

Follow-up verification on the production build after motion refinement:

- Real playback retained the old key during fade-out, then applied the latest of rapid key/mood selections. Output recovered after fade-in. A volume edit during the transition did not leak pending tonal settings.
- Pause during a pending change settled settings with a suspended context; scheduled ticks stayed frozen; resume worked. Tempo moved through an intermediate value before reaching 120 bpm.
- Sampled scene pixels showed an intermediate blend, not an immediate replacement. With audio paused, the canvas became byte-identical after the blend ended. Rapid forest-to-aurora choices settled on aurora.
- Checked overlays at 1440×900, 390×844 and 320×844, including the longer layer labels. Mixer feedback leaves the preset label and controls visible. Escape completes its exit and restores focus to the opening control.
- Reduced motion hides the decorative veil/linework, uses compact static feedback and keeps scenery static after selection.
- Production UI run had no runtime exceptions or failed requests. Axe found **0 violations** after animations settled in desktop lake/aurora, mobile lake/mixer and reduced-motion 320 px states. Transient fading text is intentionally not the stable-state contrast measurement.

A three-second stereo `OfflineAudioContext` render exercised the production `SoundBank`: sustained voices, 260 ms fade-out, a simultaneous master/mix edit, silent reset and 850 ms fade-in. Measured left-channel RMS was **0.032315 before**, **0.005303 during fade-out**, **0 at the silent reset**, and **0.022239 after recovery**. Peak was **0.122916**, with no nonfinite samples. This verifies signal-envelope behavior, not subjective listening quality.

## Evidence and reproduction

Curated screenshots: [images](images/). Detailed local screenshots and recording: ignored `output/playwright/`. Browser checks used the installed Playwright CLI and are manual release evidence, not browser CI tests.

Repeat `npm ci && npm run check`, start `npm run dev`, and test the interactions above. Useful URL: `?seed=browser-qa&tempo=120&density=80&cycle=2`. For transitions, start playback, choose keys/moods rapidly, change volume during the fade, pause mid-change and resume. With playback paused, switch scenes twice within a second and observe the final scene settle. Repeat with reduced motion enabled. No microphone is involved.

## Not yet verified

- Two-hour real-time timing/audio/heap endurance. The 10,000-cycle test only covers composition/cache behavior.
- Safari/iOS, Android hardware, sustained device performance. Rendering caps at 30 fps, not the plan's 60 fps target.
- Human Canon recognition, long-session musical quality, strict counterpoint, original-phrase corpus comparison, or no-repeat guarantees.
- Long recordings, every browser codec, cross-browser background/sleep behavior.


## Lo-fi and living landscapes

Seven additional tests cover Classic snapshot compatibility and style-aware caching, a new lo-fi v1 snapshot, chord/scale/range boundaries and rests across 7 keys × 3 moods × 3 densities × 24 cycles, exact delayed voices, swing totals, drum placement, URL defaults/round trips and style changes with concurrent mix edits.

Chromium development checks confirmed audible lo-fi output; rapid Classic/Lo-fi changes settle on the final style. All six canvases changed between time-separated captures while playing, then became byte-identical while paused and under reduced motion. Mixer feedback remained visible when scrolling to vinyl. Shared URLs retained style and vinyl level and reloaded without autoplay. Active oscillator/buffer sources at the six scene checkpoints ranged from 38 to 60; this short run is not a leak/endurance proof.

Six ten-second stereo OfflineAudioContext renders used the production synthesizer at master 100% (except mute):

| Render | Peak | RMS |
|---|---:|---:|
| Lo-fi ensemble | 0.268213 | 0.033431 |
| Drums only | 0.294690 | 0.023390 |
| Vinyl, with disabled musical voices scheduled | 0.088624 | 0.002991 |
| Vinyl control, without musical voices scheduled | 0.088624 | 0.002991 |
| Master muted | 0 | 0 |
| All layers at 100% | 0.423896 | 0.075605 |

No clipped or nonfinite samples. The matching vinyl/control outputs verified that disabled musical voices did not leak during startup. These measurements establish signal behavior, not subjective musical quality.

The final production preview passed style selection, mixer scrolling, Classic restoration and reduced-motion checks at 1440/390/320 px. Axe reported zero violations in the checked stable aurora desktop, desktop mixer, blossom mobile, mobile mixer and Classic 320 px states. No runtime exceptions or failed requests occurred.

A short desktop forest sample captured 167 animation callbacks: mean 0.144 ms, p95 0.600 ms. These are callback CPU timings, including callbacks that skip drawing to enforce the 30 fps cap; they exclude GPU presentation and do not establish sustained mobile frame rate.

## GitHub Pages deployment

The Pages workflow runs all checks before uploading `dist/` and deploying. Local evidence above does not by itself prove deployment. The deployment run and public-site smoke results are recorded in [PR #2](https://github.com/wildanniam/canon-endless/pull/2). Public smoke checks must cover `/canon-endless/` asset and worker requests, user-gesture playback, setting transitions, a scene change and a shared URL reload.


## Aurora Lake — 2026-10-03

- `npm run check`: lint, **40 tests**, strict typecheck and production build pass. Four water-note tests cover no autoplay/paused input, 100 gestures coalescing into one future eighth, actual harmony across a chord boundary, pending-transition rejection, pause/reset cancellation and muted layers. Both existing v1 music snapshots remain unchanged. Runtime dependency audit: zero vulnerabilities.
- Real Chromium: Aurora WebGL initializes, the canvas changes while playing, and pause/reduced-motion snapshots are byte-identical over separate samples. Reduced-motion gestures remain visually static. Mouse water input and Enter on the semantic water-note button schedule notes; a separate touch-enabled mobile context also schedules a note from an actual touchscreen tap.
- Desktop 1440×900, mobile 390×844 and narrow 320×740 inspected. Compact/expanded controls, key/style transitions, mobile long chord names, scene dialog, mixer and Zen exit pass. Recording remains visible/stoppable in the compact dock and downloaded a WebM. Scene changes restore the five illustrated scenes and can return to 3D; lightweight mode disposes/recreates the optional world.
- Build-production checks with WebGL 2 unavailable and an actual `WEBGL_lose_context` loss fall back to the illustrated scene; music keeps running after loss. Delaying the graphics chunk while switching to Forest does not replace the selected scene. The context-loss exercise produces the expected Three.js warning, without an uncaught exception.
- Forced adaptive-quality branch reduces a 390 px GPU canvas to 312 px and still returns a populated frame (sample brightness sum 50,914), avoiding the blank frame caused by resizing after rendering. This is branch verification, not a device-performance benchmark.
- Axe WCAG 2 A/AA + 2.1 AA: zero violations in eight stable states: initial/compact/expanded desktop, mixer, scenery dialog, compact/expanded mobile and mobile long chord labels. No uncaught exceptions or HTTP errors in the final production audit. Share reload retains Aurora, Lo-fi, B-flat and Wistful without autoplay.
- Production audio context ran with sampled ensemble RMS 0.025246. Three two-second stereo OfflineAudioContext renders of the actual water-note synth path: normal peak 0.012278/RMS 0.002932; master-muted peak/RMS 0; melody-muted peak/RMS 0; no nonfinite samples or clipping. This verifies signal behavior, not subjective listening quality.
- Initial JS is ~64.93 kB (22.82 kB gzip); optional Aurora chunk ~498.72 kB (127.26 kB gzip), loaded only on Aurora. One observed world used 12 geometries, one reflection texture, and 22 render calls including reflection. Resources and loops are bounded by design; this is not proof of a two-hour soak or mobile GPU/battery performance.

Curated screenshots: `docs/images/aurora-lake-3d.png` and `docs/images/aurora-lake-mobile.png`. Temporary browser evidence remains in ignored `output/playwright/`. Safari/iOS, physical Android, long-duration stability and human musical assessment remain unverified.

## Six 3D worlds — 2026-10-03

This extends the Aurora-only release above; all six scenes now use the optional shared renderer.

- `npm run check`: lint, **45 tests**, strict TypeScript and production build pass. Five new scene-contract tests advance each procedural environment at supplied times through 7,200 seconds, verify finite frame data and identical output for repeated time, and check reuse of scene objects/geometries. This is simulated animation data coverage, not two hours of real rendering. Both v1 music snapshots are unchanged.
- Chromium at 1440×900 and 390×844 rendered all six worlds. Screenshots were inspected; compact/expanded controls also fit 320×740. The three daylight water worlds use portrait compositions that keep shore vegetation in frame. Expanded controls remain expanded when changing surroundings. Lo-fi output was nonzero (sampled RMS 0.014567), long chord labels/mixer/Zen work, and shared settings reload silently.
- All six canvases change while playing, become byte-identical while paused, and remain byte-identical under reduced motion, including after gesture input. Enter on each scene's semantic note button schedules a note. A real Playwright touchscreen tap in Forest's open air also scheduled a note. Gestures still use the unchanged audio scheduler.
- Three repeated full tours (**18 scene swaps**) retained exactly one WebGL context. Intercepting real `createBuffer`/`deleteBuffer` calls showed **69 live buffers** on each return to Stillwater (20 geometries, one reflection texture). Scene counts stayed stable on repeated visits: Forest 77 buffers, Last light 63, In bloom 65, After the rain 68 and Aurora 41. InstancedMesh disposal explicitly releases instance matrix/color buffers in addition to geometry/material/Reflector cleanup. This short lifecycle check is not a long-duration leak guarantee.
- Production resilience: actual WebGL context loss in Forest returns to its illustration while audio continues; unavailable WebGL supports playback and further scene changes. A deliberately delayed graphics import followed by selecting Forest produced pixels identical to a fresh Forest load. Paused scene changes showed intermediate crossfade pixels. Explicit lightweight selection/restoration works across scenes.
- Axe WCAG 2 A/AA and 2.1 AA found **zero violations in 21 stable states**: initial lake, six desktop worlds, six mobile worlds, expanded mobile, long chord labels, mixer, 320 px expanded/compact, and three lightweight worlds. Portrait framing and final forest/rain/lightweight text treatments were checked again after refinement. Canvas art still requires visual contrast review; the forest canopy/header and dense-vegetation hints received dedicated contrast treatments. No uncaught exceptions or HTTP errors in the completed production interaction run. Context loss emitted the expected Three.js warning.
- Initial JS ~65.44 kB / **22.98 kB gzip**; optional graphics chunk ~540.45 kB / **140.34 kB gzip**. Vite reports its advisory 500 kB chunk warning; the chunk is already lazy and controls work before it resolves. No new runtime dependency or external art was added in this extension. Existing pixel/quality/reflection caps remain; CPU submission cost does not measure GPU FPS.

Curated new views: [Stillwater](images/stillwater-3d.png), [Forest light](images/forest-light-3d.png), [Last light](images/last-light-3d.png), [In bloom](images/in-bloom-3d.png), [After the rain](images/after-rain-3d.png), and [portrait In bloom](images/in-bloom-mobile.png). Release checks ran through the Playwright CLI; temporary evidence stays under ignored `output/playwright/`. Deployment and public smoke results are tracked in PR #2.

Remaining limits: Safari/iOS, physical Android, sustained GPU/battery performance, two-hour real-time playback and subjective listening quality remain unverified.
