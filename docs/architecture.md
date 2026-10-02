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

Web Audio and Canvas 2D keep the first version self-contained; Tone.js, sample packs and a GPU renderer are unnecessary for the current graph/visual complexity. Timbres evoke soft keys and strings but are not sampled instruments. Nature air is filtered synthetic noise, not a recording of birds or water.

Browser-native recording avoids a large encoder. Format is negotiated with `MediaRecorder`, never mislabeled as WAV/MP3. Layer/master gains ramp. Compression and bounded soft shaping reduce clipping risk; this is not a hearing-safety guarantee.

Scene rotation happens every fourth variation boundary, without replacing a scene immediately when opening a shared link. URLs serialize settings and current cycle, not earlier knob movements. Future engine changes must preserve v1 or provide explicit migration.

## Source trail

- [Supplied plan](project-plan.md), treated as product requirements and proposed approaches, not separate execution authority.
- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): gesture startup, controls, parameter automation.
- [MDN output timing](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp): audio/display timing.
- [Vite guide](https://vite.dev/guide/): development and static builds.

Sources checked 2026-10-03. See [verification](verification.md) for tested behavior and remaining limits.
