# Endless Canon — Project Plan

A website that composes a never-ending, always-changing melody inspired by **Pachelbel's Canon in D**, paired with calm, generative nature visuals. Every listen is new, but it always *feels* like the Canon.

---

## 1. Goals

- **Sounds like Canon, but new.** Keep the famous chord loop and the "voices echoing each other" feel, while the actual melody is generated live and never repeats exactly.
- **Endless.** Music plays forever without loops you can notice.
- **Beautiful nature visuals** that react to the music.
- **Optional backing track** (bass, chords, strings) the listener can switch on/off or mix.
- **Simple for anyone.** No music knowledge needed to enjoy or control it.

---

## 2. Music basics (plain-language cheat sheet)

| Term | What it means here |
| --- | --- |
| **Key** | The "home base" of the music. Canon is in **D major** (bright, happy). |
| **Chord progression** | The repeating sequence of harmonies underneath. Canon uses 8 chords that loop. |
| **Ground bass** | The low bass line that repeats the same 8 notes forever — the "heartbeat" of Canon. |
| **Canon (the technique)** | One voice plays a melody, then a 2nd voice copies it a bit later, then a 3rd — like singing "Row, Row, Row Your Boat" in a round. |
| **Chord tone** | A note that belongs to the current chord — always sounds "safe". |
| **Passing tone** | A note between two chord tones that makes the melody flow smoothly. |

### The Canon chord loop (in D major)

```
D  →  A  →  Bm  →  F#m  →  G  →  D  →  G  →  A   (repeat)
I     V     vi     iii     IV    I     IV    V
```

Bass line: **D – A – B – F# – G – D – G – A**, 2 beats per chord, 8 chords = one 4-bar cycle.

The Roman numerals (I, V, vi…) let us move the same progression to *any key* and it will still sound like Canon.

---

## 3. What makes it "Canon-like but distinct"

**Keep (the familiar DNA):**
1. The 8-chord loop and the walking ground bass — always.
2. Round/echo structure: new voices enter 2 bars (1 cycle) after the previous one, copying the melody.
3. Gradual build-up: starts simple (slow notes) and grows busier over time, like the original.
4. Baroque-style smooth, stepwise melodies.

**Change (the new part):**
1. Melodies are **generated**, not copied from Pachelbel.
2. Rhythms, contours (up/down shapes), and ornaments vary every few cycles.
3. Optional key changes, tempo, instrument, and mood settings.
4. Occasional "quotes" of the famous descending motif (F#–E–D–C#–B–A–B–C#) to keep it recognizable — rarely and varied, so it's a nod, not a copy.

---

## 4. Generative melody engine

### 4.1 Rules (so it always sounds good)
- **Strong beats** (beat 1 & 3) → use a **chord tone** of the current chord.
- **Weak beats** → chord tones, passing tones, or neighbor notes from the scale.
- **Mostly small steps**; leaps allowed but followed by a step back the other way.
- **Stay in range** (e.g., D4–D6 for melody) so it never gets shrill or muddy.
- **Avoid clashes** with other canon voices (no parallel 5ths/octaves — optional "strict mode").
- **Phrase endings** land on stable notes (D, F#, A in D major) at the end of each 8-chord cycle.

### 4.2 Variation "stages" (like the original's evolution)
The engine moves through stages, cycling and remixing them endlessly:

| Stage | Feel | Note speed |
| --- | --- | --- |
| 1. Calm | Long, singing notes | Half / quarter notes |
| 2. Flowing | Gentle stepwise lines | Eighth notes |
| 3. Lively | Running scales | Sixteenth notes |
| 4. Playful | Leaps, arpeggios, dotted rhythms | Mixed |
| 5. Ornamented | Trills, turns, grace notes | Mixed |
| 6. Rest | Thin back to 1–2 voices, breathe | Slow |

Each stage lasts a random 2–6 cycles, with smooth transitions.

### 4.3 How a melody is generated
1. Pick a **motif** (a short 1–2 beat idea) using weighted random choices + the rules above.
2. **Develop** it across the 8 chords: repeat, transpose to fit each chord, invert, or reverse.
3. Store the finished 2-bar phrase in a **phrase buffer**.
4. Voice 2 and 3 play the same phrase 1 and 2 cycles later (the canon echo).
5. Use a **seeded random generator** so a great session can be shared/replayed via URL (`?seed=1234`).

Optional upgrade: a simple **Markov chain** trained on Baroque melodies for more natural motifs.

### 4.4 Keys & modes
- Default: **D major**.
- Options: C, G, E♭, F major, etc. (same chord loop, transposed).
- "Mood" presets: *Bright* (major), *Wistful* (minor version: Dm–Am–B♭–F–Gm–Dm–Gm–A), *Dreamy* (slower + reverb).
- **Auto-modulate** (optional): every ~5 minutes, gently shift to a related key (e.g., D → A → G → D).

---

## 5. Optional backing track

Toggle each layer on/off, with a volume slider:

| Layer | Sound | Plays |
| --- | --- | --- |
| **Ground bass** | Cello / contrabass | The D–A–B–F#–G–D–G–A line |
| **Chords** | Harpsichord or soft piano | Block or broken chords |
| **Pad** | Warm string ensemble | Long sustained chords |
| **Pizzicato** | Plucked strings | Light rhythmic pulse |
| **Nature ambience** | Birds, stream, wind, rain | Matches the current scene |

Presets: **Melody only**, **Classic quartet**, **Full orchestra**, **Lo-fi** (soft beat + vinyl crackle).

> Bonus: a **"Rewind"** button that lets you go back to a previous variation you liked (keeps the last ~10 phrases in memory), and a **"Favorite"** button to save a seed.

---

## 6. Nature visualizations

### 6.1 Scenes (rotate slowly or pick one)
1. **Forest at dawn** — light rays, floating pollen, swaying trees.
2. **Lake reflections** — ripples appear with each note.
3. **Mountain sunset** — clouds drift, color shifts with chords.
4. **Cherry blossoms** — petals fall in rhythm.
5. **Night sky / aurora** — stars twinkle with notes, aurora waves with the bass.
6. **Rainy meadow** — raindrops = notes, flowers bloom on phrase endings.

### 6.2 Music → visual mapping
| Music | Visual |
| --- | --- |
| Each melody note | Particle / ripple / petal / star spawns; pitch = height on screen |
| Chord change | Color palette gently shifts (8 palettes, one per chord) |
| Bass note | Ground pulse, tree sway, water swell |
| Loudness / busyness | Wind strength, particle count |
| Canon voice (1, 2, 3) | Different color or element per voice |
| Stage change | Time-of-day or weather transition |
| Key change | Season change (spring → summer → autumn → winter) |

---

## 7. User interface

- **Big Play / Pause** button (browsers need a click before audio starts).
- **Scene picker** and **Auto-rotate scenes** toggle.
- **Simple sliders:** Tempo (slow ↔ fast), Busyness (calm ↔ lively), Volume.
- **Key & mood** dropdown.
- **Backing track** panel with layer toggles.
- **Rewind / Favorite / Share link** buttons.
- **Record** 1–5 min to WAV/MP3 (optional).
- **Fullscreen / Zen mode:** hides all controls.
- Mobile-friendly, keyboard shortcuts (Space = play/pause, ← = rewind).

---

## 8. Tech stack

| Part | Choice | Why |
| --- | --- | --- |
| Framework | **Vite + TypeScript** (optionally React/Svelte for UI) | Fast, simple |
| Audio | **Tone.js** (on Web Audio API) | Scheduling, instruments, effects |
| Instruments | **Tone.Sampler** + free samples (e.g., Salamander piano, VSCO 2 CE strings) | Realistic sound |
| Effects | Reverb, gentle compressor, limiter | Polished, safe volume |
| Visuals | **PixiJS** (2D) or **Three.js** (3D) + custom shaders | Smooth 60fps |
| Randomness | Seeded PRNG (e.g., `seedrandom`) | Shareable sessions |
| Recording | `MediaRecorder` on the audio output | Simple export |
| Hosting | Vercel / Netlify / GitHub Pages | Free static hosting |

---

## 9. Project structure

```
endless-canon/
├── index.html
├── src/
│   ├── main.ts
│   ├── music/
│   │   ├── theory.ts          # scales, chords, Roman numerals, transposition
│   │   ├── progression.ts     # Canon loop + minor variant
│   │   ├── melodyGenerator.ts # motifs, rules, development
│   │   ├── stages.ts          # variation stage machine
│   │   ├── canonVoices.ts     # echo/round logic
│   │   ├── backingTrack.ts    # bass, chords, pad, pizzicato
│   │   ├── scheduler.ts       # Tone.Transport timing, look-ahead
│   │   └── history.ts         # rewind buffer, seeds
│   ├── audio/
│   │   ├── instruments.ts
│   │   └── mixer.ts
│   ├── visuals/
│   │   ├── engine.ts
│   │   ├── mapping.ts         # music events → visual events
│   │   └── scenes/ (forest, lake, mountain, blossom, aurora, rain)
│   ├── ui/ (controls, panels)
│   └── events.ts              # shared event bus (noteOn, chordChange, stageChange)
├── public/samples/
└── README.md
```

**Key idea:** the music engine emits events (`noteOn`, `chordChange`, `stageChange`, `keyChange`) on an event bus; visuals just listen. This keeps music and visuals independent.

---

## 10. Milestones

| # | Milestone | Outcome | Est. |
| --- | --- | --- | --- |
| 1 | Setup + theory module | Chords/scales in any key, unit tests | 1–2 days |
| 2 | Ground bass + chords playing forever | The Canon "bed" loops cleanly | 1–2 days |
| 3 | Melody generator v1 | Rule-based melody that fits chords | 3–4 days |
| 4 | Canon voices + stages | Round echoes, build-up/release | 2–3 days |
| 5 | Backing track controls | Layer toggles, presets, mixer | 1–2 days |
| 6 | First visual scene (Lake) | Notes → ripples, chords → colors | 2–3 days |
| 7 | More scenes + transitions | 4–6 scenes, auto-rotate | 4–6 days |
| 8 | UI polish | Sliders, key/mood, zen mode, mobile | 2–3 days |
| 9 | Extras | Rewind, seeds/share, recording | 2–3 days |
| 10 | Testing, performance, deploy | Launch 🎉 | 2 days |

Total: roughly **3–5 weeks** for one developer.

---

## 11. Quality checks

- **"Does it sound like Canon?"** — play for friends without telling them; can they recognize it within ~30 seconds?
- **"Is it distinct?"** — no 2-bar phrase should exactly match Pachelbel's original (automated check against a list of original phrases).
- **Endurance test** — run 2+ hours: no memory leaks, no timing drift, no audio glitches.
- **Rule tests** — strong-beat notes are always chord tones; range limits respected.
- **Performance** — 60fps visuals on a mid-range laptop and phone; audio never stutters (audio has priority over visuals).
- **Accessibility** — reduced-motion mode, keyboard controls, volume limiter.

---

## 12. Stretch ideas

- AI melody model (e.g., Magenta.js) as an alternative "creative" mode.
- Show sheet music scrolling live for curious listeners.
- Let users hum or tap a motif and the engine develops it into a canon.
- Day/night scene synced to the listener's local time.
- Other famous progressions as bonus modes (e.g., "Pachelbel pop" progression used in modern songs).

---

## 13. Notes

- Pachelbel's Canon is in the **public domain**, so using its progression and style is fine. Use samples/sounds with free or commercial-friendly licenses.
- Audio in browsers can only start after a user click — the Play button handles this.
