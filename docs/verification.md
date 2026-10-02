# Verification — 2026-10-03

## Automated checks

`npm run check` passed: ESLint, strict TypeScript, **20 Vitest tests**, Vite production build.

- Major/minor progressions and transposition across seven keys.
- Chord membership on strong beats, scale/range, positive duration and 64-tick coverage across 7 keys × 3 moods × 3 movement levels × 48 cycles.
- Determinism, v1 snapshots, predominantly stepwise motion, seeking directly to cycle 1,000,000.
- Voice entrances, exact delayed echoes, rest with two voices, stage durations across 30 epochs.
- Cache ≤12 entries across 10,000 simulated cycles with changing settings.
- Complete URL round trips, invalid/prototype/empty parameters, preset isolation, corrupt/blocked storage, favorite cap.

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

## Evidence and reproduction

Curated screenshots: [images](images/). Detailed local screenshots and recording: ignored `output/playwright/`. Browser checks used the installed Playwright CLI and are manual release evidence, not browser CI tests.

Repeat `npm ci && npm run check`, start `npm run dev`, and test the interactions above. Useful URL: `?seed=browser-qa&tempo=120&density=80&cycle=2`. No microphone is involved.

## Not yet verified

- Two-hour real-time timing/audio/heap endurance. The 10,000-cycle test only covers composition/cache behavior.
- Safari/iOS, Android hardware, sustained device performance. Rendering caps at 30 fps, not the plan's 60 fps target.
- Human Canon recognition, long-session musical quality, strict counterpoint, original-phrase corpus comparison, or no-repeat guarantees.
- Long recordings, every browser codec, cross-browser background/sleep behavior.
- A deployed public website; GitHub source and local preview do not establish deployment.
