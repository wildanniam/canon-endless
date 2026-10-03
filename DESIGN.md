# Endless Canon design brief

## Register and path

Hybrid listening instrument. A visitor arrives, presses Play, hears the composition grow, then optionally changes their surroundings or ensemble. Music is the product. No marketing sections, accounts, feeds or analytics.

## Visual target

A quiet illustrated field recording sleeve: pale parchment sky, layered sage mountain silhouettes, a broad lake with delicate horizontal reflections, dark botanical details at the edges. The composition occupies the whole screen. The upper left carries an editorial serif title; the bottom holds one warm ivory instrument panel. The scene is drawn locally and remains recognizable without motion. This brief is the visual source of truth for the first version.

- Color: parchment #f5f1e7, ink #29392f, muted #657067, moss #53634a, divider #dcded1. Warm terracotta only for recording.
- Type: self-hosted Cormorant Garamond display and DM Sans controls; generous display line height, controls no smaller than 12px.
- Density: spacious sky, compact functional controls. A single dock rather than repeated floating cards.
- Six scenes: lake dawn, forest light, mountain sunset, cherry blossom, aurora, rainy meadow. Each has its own geometry, palette and motion.
- Motion: one canvas at capped pixel density, bounded event particles, pause and reduced-motion support. Music notes create ripples/particles, chord changes tint the atmosphere, bass causes a subtle swell.

## Components and hierarchy

Top masthead: wordmark, local favorite, share and about. Main title, concise description, scene label. Bottom status: stage, voices, cycle. Dock: primary Play/Pause, rewind, live chord progression, tempo/density/volume, key/mood. Bottom toolbar opens native dialogs for scenes/mixer/saved sessions and toggles Zen. Settings retain focus and don't unexpectedly start sound.

## States

- Initial: intentional silent scene, prominent Play, no fake progress.
- Starting: disabled play while the audio context resumes. Errors announced in a status region, retry available.
- Playing/paused: visible text and icon, live progression, static scene when paused.
- Inputs: native range/select/checkbox with labels, visible focus, proper numeric output.
- Dialogs: native modal dialog, named heading, close control, Escape, focus return, bounded scroll on mobile.
- Sharing: copy success or an editable URL fallback. Favorites: local persistence, honest failure, empty state.
- Recording: feature detection, explicit start/stop, duration limit, real file download; never uses a microphone.
- Zen: hide chrome but keep accessible exit, restore focus, Escape to exit.

## Responsive and access

Desktop target 1440×900; mobile 390×844. Dock becomes two columns on narrow screens, with primary transport spanning the width. Allow page scrolling at short heights; no clipped fixed panels. Touch targets ≥44px. Keyboard Space = play/pause, left arrow = previous cycle only outside form controls, Z = zen, Escape = close/exit. Reduced motion uses a static scene, including while audio plays.

## Avoid

Glass panels, neon gradients, generic dashboard cards, fabricated activity, unreadable tiny labels, autoplay, full-screen animations in reduced-motion mode, third-party image/font fetches at runtime.

## Verification

Check first-play, pause/resume, settings, scenes, mixer, saved/share links, keyboard, zen, recording, mobile scrolling and reduced motion in a real browser. Inspect canvas screenshots as well as DOM. Browser audio graph/render checks are not a substitute for human listening or a two-hour real-device soak.

## Motion refinement — 2026-10-03

User feedback: music settings and surroundings currently change too abruptly; add a visible transition overlay and smoother motion. Keep the existing visual language and layout.

- Signature transition: a light veil over the scenery, three drawn melodic lines, and a short “Settling into…” label identifying the actual new setting. It does not intercept pointer or keyboard input. Mixer feedback appears inside its native dialog.
- Tonal changes: fade out for about 300 ms, apply the latest requested key/mood/movement at silence, then fade in over 850 ms. Volume and layer automation have their own gains so they cannot cancel that fade. Pausing or loading a session settles pending state without starting audio.
- Continuous controls: volume and mix ramp; tempo glides over 900 ms. Slider feedback appears when committing a value, rather than covering the screen during a drag.
- Scenery: 1.4-second crossfade, including while paused. Rapid scene changes start from the current blended image, with one retained snapshot. The scene returns to rest after the transition.
- Panels/buttons: restrained 180–250 ms opacity/translation, stable native dialog focus, no bouncing. Initial entrance happens once.
- Reduced motion: no scenery crossfade, transform choreography or animated linework. A compact static setting notification remains; audio smoothing is unchanged.

## Lo-fi and living landscapes — 2026-10-03

Extend the listening instrument, retaining its illustrated sleeve and calm hierarchy. Add a clearly labeled Style selector beside key/mood: Classic and Lo-fi. Lo-fi opens at 68 bpm with warm electric-piano voices, space between syncopated phrases, swung eighths, soft drums and adjustable vinyl. Style changes use the existing audio/overlay transition; shared sessions preserve them. Classic v1 phrases remain unchanged.

Make the environment visibly alive while listening: drifting sky haze and flying birds, shimmering water, wind through foreground reeds, forest light and fireflies, falling blossom petals, flowing aurora curtains, and layered rain with splashes. Keep motion away from the title when possible, never move the controls, and use gentle beat/note response instead of flashing. Cached landscape geometry remains; bounded scene effects run at the existing 30 fps limit. Pause freezes the whole scene, reduced motion renders a still, and hidden tabs stop drawing. Verify all six scenes on desktop/mobile and compare time-separated canvas frames.

## Aurora Lake — approved 2026-10-03

Wildan approved the immersive direction. Implement one illustrated 3D night lake, retaining the five other scenes and the same listening workflow. Use Three.js only for Aurora; no framework migration or external art/textures. Visual target: expansive ink-blue sky, mint aurora curtains, a small warm moon, layered angular mountains fading into mist, reflective water and dark pines framing the edges. Leave the middle of the lake open. Three amber, mint and pearl trails follow real canon note events; no decorative fake voices.

After Play in Aurora, fade the welcome copy and collapse the instrument into a compact ivory dock, leaving an explicit Controls toggle, Play/Pause and surroundings access. Expanding restores the existing settings and footer without duplicating controls. Keep the dock in page flow, accessible at 320 px/short heights; do not steal focus or collapse while a hidden control holds focus. In Zen, retain the existing accessible exit. Tap/drag open water to add quiet chord-tone notes quantized to the scheduler's next eighth; offer a keyboard-accessible water-note button. Silent/paused scenes never start audio. Interactive notes are ephemeral, routed through the melody/master/recording chain and do not change versioned compositions.

Motion budget: one capped 30 fps loop, slow camera drift and pointer parallax, locally animated water/sky, bounded trails/ripples, 1.4-second scene blends from the visible frame. The aurora slowly evolves during listening. Reduced motion uses a still; pause freezes time; hidden tabs stop drawing. Lazy-load Three.js, cap render resolution, lower it when sustained render cost is high, offer a lightweight scenery switch, and fall back to Canvas 2D on initialization or context loss. Loading keeps the existing scene visible. No bright flashes or aggressive bloom.

Verify startup with/without WebGL, delayed imports/rapid scene changes, context loss, controls/focus, keyboard/touch notes, mute and setting changes, desktop/mobile, pause/reduced motion and public deployment. Target screenshots: 1440×900 and 390×844, plus 320 px overflow check. Real mobile GPU/battery claims require device evidence.

## Six living worlds — approved 2026-10-03

Wildan likes the Aurora implementation and requests the same depth/effects across the other backgrounds, with varied combinations. The hybrid listening workflow and illustrated aesthetic continue. Preserve Aurora's geometry and palette; extend compact Play, Controls, gestures and lightweight mode to every scene.

| World | Composition and palette | Signature motion / touch response |
|---|---|---|
| Stillwater | Open dawn lake, pale apricot sky, sage hills, reeds and lily pads framing clear water | Drifting low mist, birds, water reflections; touch makes rings |
| Forest light | Tall trunks and clustered overhead crowns, a winding moss path, a warm opening in the canopy | Angled sun shafts, floating pollen and fireflies; touch gathers lights above the path |
| Last light | Wide ochre/mauve mountain valley, near crags and low cloud layers, setting sun | Slow cloud passage, flocking birds and warm melodic trails; touch releases a small updraft of lights |
| In bloom | Pink cherry crowns and dark branching trunks around a reflecting pond, plum distant hills | Fluttering petals, drifting reflected canopy; touch sends rings and a petal swirl |
| After the rain | Green meadow banks and flowers around wet ground, slate clouds opening to soft light | Rain streaks, puddle rings, swaying grass, a restrained rainbow; touch splashes |
| Aurora Lake | Existing mint aurora, ink sky and reflective wooded lake | Preserve the existing three trails, moon and water interaction |

Reuse one renderer and camera; dispose/rebuild only scene-owned resources. No cache of six contexts or continuously drawing hidden worlds. One 30 fps loop, fixed effect pools, bounded reflection target, adaptive resolution, pause/visibility/reduced-motion behavior and captured-frame crossfades remain. All scenes load optionally over their ready 2D illustration; disabled/unavailable WebGL retains a complete experience. Keep expanded/compact choice when changing surroundings. Gestures use the unchanged future-chord scheduler; new wording describes the scene instead of always referring to water. Scene palettes must keep the masthead, feedback and interaction hint legible on desktop and mobile.

Verification: every scene at 1440×900 and 390×844, 320 px controls, semantic interaction button/touch, playback/settings/share, paused and reduced-motion canvas equality, rapid switching including during initial load, forced context loss and lightweight restoration. Repeated full scene tours must not accumulate WebGL resources. Review actual screenshots for unique silhouettes and framing; preserve Aurora visually.
