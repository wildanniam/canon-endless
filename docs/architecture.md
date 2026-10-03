# Architecture and scope decisions

2026-10-03. Implementation of the supplied plan, tracked in [issue #1](https://github.com/wildanniam/canon-endless/issues/1).

## Musical interpretation

Eight chords at two beats each make **16 beats, four bars of 4/4**, not two bars. Echoes follow one and two complete progression cycles later, meeting the same harmony as the original phrase.

A deterministic v1 PRNG, short contour motif, range-centering bias, mostly small steps, varied rhythm and leap compensation shape each phrase. Strong-beat onsets are chord tones; notes never span harmony boundaries. The phrase ends on the dominant root, resolving into the next tonic cycle. This differs deliberately from the plan's tonic-note ending while its final A chord sounds.

Six stages each last 2–6 cycles in a 24-cycle epoch. Durations are seeded; direct seeking does not rebuild the past. Rest removes voice three. Movement changes rhythmic density; Ornamented uses sixteenth-note neighbors rather than a dedicated grace-note/trill engine. No strict contrapuntal or uniqueness guarantee is made.

## Module map

| Module                         | Responsibility                                                |
| ------------------------------ | ------------------------------------------------------------- |
| `music/random.ts`              | Stable hash and seeded PRNG                                   |
| `music/theory.ts`              | Keys, scales, progression and frequencies                     |
| `music/composer.ts`            | Phrases, stages, 12-entry cache, delayed voices               |
| `audio/synth.ts`               | Timbres, layer gains, noise, reverb, compressor, soft limiter |
| `audio/player.ts`              | Look-ahead transport, interruption recovery, recording        |
| `audio/timer.worker.ts`        | 25 ms wakeups, independent of visual frames                   |
| `events.ts`                    | Typed music events                                            |
| `visuals/landscape.ts`         | Procedural landscapes and thumbnails                          |
| `visuals/engine.ts`            | Music-reactive particles, scene dissolves, motion preferences |
| `settings.ts`                  | Validated URLs, presets, seeds and favorites                  |
| `main.ts`, `ui/*`, `style.css` | Semantic controls, persistence and responsive UI              |

## Lo-fi arrangement and living scenery

`music/lofi.ts` defines a separate `lofi-v1` seeded phrase path: repeated short contours, off-beat responses, rests and chord anchors. Classic composition and its snapshots are unchanged. Style is part of the bounded cache key and share URL; missing/invalid style defaults to Classic with the two new layers off. Eighth-note tick ratios 1.16/0.84 preserve each four-tick beat. Three voices still echo exact earlier phrases.

Lo-fi voices use softer upper partials, a slight inharmonic tine and a slow three-cent pitch curve. A shared low-pass filter softens the ensemble. Kick is a pitched sine envelope; snare/hat use a reusable noise buffer; vinyl uses a quiet seeded loop of hiss/crackle. Drum voices disconnect on end and count toward active audio sources. Layers start at zero before their requested gains ramp in. Both new layers pass through the same master, transition gate and recording output.

The Style selector loads Lo-fi afternoon at 68 bpm or Classic quartet at 72 bpm. Selecting the Lo-fi afternoon preset also selects that style. Other mixer presets change the mix only, leaving the chosen melodic style. Drums can also be enabled in Classic with straight timing. Changes use the existing fade/coalescing path.

`visuals/living.ts` draws bounded environmental motion over cached scenery: 140 shared fleck descriptors, at most 140 rain strokes, 85 stars, three aurora curtains, 70 grasses, or 22 forest lights. Large foreground trees and blossom branches sway separately; thumbnails remain static. Notes retain bounded ripples/particles, and kicks gently affect forest light. The old scene snapshot overlays the complete new scene, including effects, so crossfades do not reveal a new foreground abruptly.

## Scheduling and resources

The audio clock is authoritative. A worker wakes every 25 ms; the player schedules 180 ms ahead using sixteenth-note ticks. Tempo glides over 900 ms using smoothstep interpolation, affecting future ticks. Visuals consume due events using output latency where available. After a stall, the next deadline moves forward without bursting overdue notes; the musical position is retained rather than tracking wall time.

Pause suspends the context, preserving scheduled notes and tails. Key/mood/density changes and rewind use an independent post-compressor gain: fade out over 260 ms, apply the latest requested settings at 300 ms, clear oscillators/reverb at silence, then fade in over 850 ms. Rapid edits update the pending target instead of creating timers. Live mix/master edits cannot overwrite pending tonal settings. Pause and browser interruption settle pending changes while silent; resume fades in over 550 ms. Browser/OS interruptions set the UI to paused and request a fresh gesture.

- Cache ≤12 phrases, visual queue ≤256 events, particles ≤72.
- Oscillators, envelopes and panners disconnect after release.
- Scenery rasterizes on resize/scene change. A single snapshot of the visible frame dissolves over 1.4 seconds; interrupted blends capture the current blend. Paused scenes draw only until the dissolve ends, then release the snapshot. Animation caps at 30 fps and pixel ratio 1.75.
- Hidden tabs stop drawing; reduced motion keeps the canvas static. Audio does not depend on drawing.
- Recording stops after five wall-clock minutes, including pauses, to bound memory.

## Interaction motion

`ui/motion.ts` owns one cancelable feedback timer and a progress animation. The landscape overlay never intercepts input; an `aria-live` status announces changes. Mixer feedback stays inside the native dialog. CSS handles entrance and hover motion; native dialog exits retain focus trapping until the 180 ms animation completes. Reduced motion uses static compact feedback, immediate scene/panel changes and no decorative animation; audio smoothing remains active.

## Tradeoffs

Web Audio and procedural art keep the app self-contained. The initial Canvas 2D implementation now has an optional shared Three.js renderer; Tone.js and sample packs remain unnecessary for the audio graph. Timbres evoke soft keys and strings but are not sampled instruments. Nature air is filtered synthetic noise, not a recording of birds or water.

Browser-native recording avoids a large encoder. Format is negotiated with `MediaRecorder`, never mislabeled as WAV/MP3. Layer/master gains ramp. Compression and bounded soft shaping reduce clipping risk; this is not a hearing-safety guarantee.

Scene rotation happens every fourth variation boundary, without replacing a scene immediately when opening a shared link. URLs serialize settings and current cycle, not earlier knob movements. Future engine changes must preserve v1 or provide explicit migration.

## Source trail

- [Supplied plan](project-plan.md), treated as product requirements and proposed approaches, not separate execution authority.
- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): gesture startup, controls, parameter automation.
- [MDN output timing](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp): audio/display timing.
- [Vite guide](https://vite.dev/guide/): development and static builds.

Sources checked 2026-10-03. See [verification](verification.md) for tested behavior and remaining limits.


## Shared living worlds (2026-10-03; extends Aurora Lake)

`visuals/world.ts` is the shared lazy-loaded Three.js/WebGL 2 renderer. `visuals/world-shaders.ts` contains authored daylight/aurora sky, water and glowing-particle shaders; `world-presets.ts` owns six palettes and lighting setups. Aurora geometry remains in `world.ts`, while `world-scenes.ts` builds the five other environments. Mountains use bounded faceted strips; 100 three-tier pines and shoreline rocks use instanced geometry. Three trails of 48 points react to real note/voice events, alongside 90 ambient fireflies. The Reflector addon renders the sky and shores into one 256/512 px reflection target; eight reusable ripple uniforms distort and tint the reflected water. There are no external textures, model loaders, bloom passes or extra animation loops.

`Landscape` composites the GPU canvas into the existing visible Canvas 2D frame. This retains interruption-safe crossfades between every scene, including mixed renderer transitions. It owns the sole 30 fps visual loop, pause time and visibility/reduced-motion behavior. The renderer/context is retained across scene switches. Outgoing scene geometries, materials, InstancedMesh instance buffers and Reflector render targets are disposed before rebuilding the selected scene. The world is fully disposed on lightweight selection/HMR, and permanently falls back for that page after initialization/shader/context failure. An import generation token prevents a disposed or lightweight view from recreating resources. A late import cannot change the active scene.

The renderer caps pixel ratio at 1.4 and initial pixel budgets at 650k narrow/1.45m wide (with a .55 resolution floor). After 120 render samples, average synchronous render cost over 24 ms reduces quality by 20%, down to approximately 64%. This is a conservative CPU submission heuristic, not measured GPU time or guaranteed FPS. Explicit lightweight mode uses the existing illustration. All six scenes retain their original Canvas 2D illustration for that mode.

`Player.playWaterNote` holds one normalized gesture. The audio scheduler consumes it on the next unscheduled even sixteenth tick, choosing one of six chord tones from the chord at that future tick. Drag events coalesce; one note per eighth is the maximum. Pending input is cleared on pause, interruption, tonal reset or rewind. Muted melody/master and pending tonal transitions reject gestures. Notes use the existing melody gain, transition gate and recording output, and never change v1 generated phrases. A separate `touch` event keeps gestures out of the three canon trails.

The existing dock collapses on Play in every scene. Scene changes preserve an explicitly expanded dock. A native Controls/Minimize button exposes the same controls; no duplicate music controls are introduced. Automatic collapse avoids hiding a focused setting. Welcome content is inert while listening; Zen keeps its exit. Water or open-air pointer input is separate from semantic UI controls, and a labeled button provides keyboard access to gesture notes. The lightweight choice is page-local and intentionally does not alter shared music settings.


The five daylight worlds use instanced trees, grasses, flowers, lily pads and cherry petals, layered faceted ridges, shader mist and drifting clouds. Forest and mountain are dry scenes and skip reflection rendering. Lake, blossom and rain reflect their visible surroundings. Rain adds 240 moving line drops and procedural water rings; the meadow has 650 grass blades. The cherry grove has 160 fluttering petals; gestures briefly widen their sway. Small flocks use dynamic line buffers. Aurora retains its previous geometry, palette and sky formula. Water-world surroundings narrow their horizontal composition in portrait view so shoreline trees remain visible; the camera, sky and interaction plane keep their projection. Every world shares three 48-point note trails, 90 ambient lights and eight reusable 12-point touch bursts.

Scene time remains authoritative for all visual movement: pause and reduced motion stop sky, vegetation, weather, camera and particles together. Reduced-motion pointer input still uses the correct scene hit test without changing visual state. Forest/mountain gestures intersect an air plane; water-world gestures intersect the lake plane. Their musical scheduling remains the same bounded, ephemeral path and does not change either v1 composition snapshot.
