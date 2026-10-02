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
