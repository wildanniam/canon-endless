import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "./style.css";
import { Player } from "./audio/player";
import { Landscape } from "./visuals/engine";
import { SCENE_INFO, thumbnail } from "./visuals/landscape";
import type { MusicStyle } from "./music/composer";
import { STAGES, stageAt } from "./music/composer";
import { KEYS, progression } from "./music/theory";
import type { Key, Mood } from "./music/theory";
import {
  LAYERS,
  PRESETS,
  SCENES,
  newSeed,
  parseSettings,
  readFavorites,
  sessionUrl,
} from "./settings";
import type { Favorite, Layer, Scene } from "./settings";
import { icon, logo } from "./ui/icons";
import { ChangeFeedback, openPanel, closePanel } from "./ui/motion";

let settings = parseSettings(location.search, newSeed());
export const player = new Player(settings);
const $ = <T extends Element = HTMLElement>(selector: string): T =>
  document.querySelector<T>(selector)!;
const app = $("#app");
const options = (items: string[]) =>
  items.map((item) => `<option value="${item}">${item}</option>`).join("");
const range = (
  id: string,
  label: string,
  value: number,
  min = 0,
  max = 100,
  suffix = "",
) => `
  <div class="range-control"><label for="${id}">${label}<output id="${id}-value" for="${id}">${value}${suffix}</output></label>
  <input id="${id}" type="range" min="${min}" max="${max}" value="${value}" /></div>`;

app.innerHTML = `
  <canvas id="landscape" aria-hidden="true"></canvas>
  <div class="change-surface" aria-hidden="true">
    <div class="change-veil"></div>
    <div class="change-message">
      <svg class="change-lines" width="140" height="58" viewBox="0 0 140 58" fill="none"><path d="M4 29C28-7 42-7 70 29s42 36 66 0"/><path d="M4 29C28 1 42 1 70 29s42 28 66 0"/><path d="M4 29C28 9 42 9 70 29s42 20 66 0"/></svg>
      <p class="change-eyebrow" data-change-label>Settling into</p>
      <p class="change-title" data-change-title></p>
      <p class="change-detail" data-change-detail></p>
      <div class="change-track"><span id="change-progress"></span></div>
    </div>
  </div>
  <div id="change-announcement" class="sr-only" role="status" aria-live="polite"></div>
  <div class="chrome">
    <header class="masthead">
      <a class="wordmark" href="./" aria-label="Endless Canon home">${logo}<span>endless canon</span></a>
      <div class="header-actions">
        <button class="icon-button" id="favorite" aria-label="Save this session" aria-pressed="false" title="Save this session">${icon("heart")}</button>
        <button class="icon-button" id="about" aria-label="About Endless Canon" title="About Endless Canon">${icon("info")}</button>
        <button class="share-button" id="share" aria-label="Share a moment">${icon("share", 17)}<span>Share a moment</span></button>
      </div>
    </header>
    <main>
      <section class="introduction" aria-label="Welcome">
        <p class="eyebrow"><span class="tiny-line"></span>A little room to listen</p>
        <h1>A familiar melody.<br><em>An endless beginning.</em></h1>
        <p class="intro-copy">Inspired by Pachelbel. Composed in the moment.<br>Let the music take its own course.</p>
      </section>
      <div class="scene-caption"><span class="scene-number" id="scene-number">01</span><span class="caption-line"></span><span id="scene-place">A lake at first light</span></div>
      <section class="instrument" aria-label="Music player">
        <div class="dock">
        <div class="session-status">
          <div class="stage-status"><span id="playing-dot" class="status-dot"></span><span id="stage-label">Ready when you are</span><span class="stage-separator">/</span><span id="voice-label">One melody, unfolding</span></div>
          <span id="cycle-label">Variation 001</span>
        </div>
          <div class="transport-row">
            <div class="transport">
              <button id="play" class="play-button" aria-label="Play music">${icon("play", 27)}</button>
              <div class="track"><strong id="play-label">Begin listening</strong><span id="track-subtitle">Canon in D major</span></div>
              <button id="rewind" class="icon-button rewind" aria-label="Rewind one variation" title="Rewind one variation" disabled>${icon("rewind", 21)}</button>
            </div>
            <div class="progression" id="progression" aria-label="Canon chord progression"></div>
          </div>
          <div class="controls-row">
            ${range("tempo", "Tempo", settings.tempo, 40, 120, " bpm")}
            ${range("density", "Movement", settings.density)}
            ${range("volume", "Volume", settings.volume, 0, 100, "%")}
            <div class="select-control"><label for="key">Key</label><select id="key">${options(Object.keys(KEYS))}</select></div>
            <div class="select-control"><label for="mood">Mood</label><select id="mood"><option value="bright">Bright</option><option value="dreamy">Dreamy</option><option value="wistful">Wistful</option></select></div>
            <div class="select-control"><label for="style">Style</label><select id="style"><option value="classic">Classic</option><option value="lofi">Lo-fi</option></select></div>
          </div>
          <div class="dock-footer">
            <button id="scenes" class="scene-button" aria-haspopup="dialog"><img id="scene-preview" alt=""/><span><span class="button-overline">Your surroundings</span><strong id="scene-name">Stillwater</strong></span>${icon("down", 16)}</button>
            <span class="toolbar-divider"></span>
            <button id="mixer" class="text-button" aria-haspopup="dialog">${icon("mix", 18)}<span>The ensemble</span></button>
            <button id="saved" class="text-button" aria-haspopup="dialog">${icon("heart", 18)}<span>Saved</span></button>
            <div class="footer-spacer"></div>
            <button id="record" class="text-button record-button" title="Record up to 5 minutes; saves a browser-native audio file">${icon("record", 16)}<span>Record</span></button>
            <button id="zen" class="icon-button" aria-label="Enter zen mode" title="Zen mode (Z)">${icon("zen", 18)}</button>
          </div>
        <div class="footnote"><span>Never quite the same. Always a little familiar.</span><span class="keyboard-hint"><kbd>space</kbd> to pause <span>·</span> <kbd>z</kbd> to just be</span></div>
        </div>
      </section>
    </main>
  </div>
  <button id="exit-zen" class="exit-zen" hidden>${icon("zen", 17)}<span>Back to the music</span><kbd>esc</kbd></button>
  <div id="toast" role="status" aria-live="polite"></div>
  <dialog id="scene-dialog" aria-labelledby="scene-dialog-title">
    <div class="dialog-heading"><div><p class="eyebrow">A change of scenery</p><h2 id="scene-dialog-title">Find your somewhere.</h2></div><button class="icon-button" data-close aria-label="Close surroundings">${icon("close")}</button></div>
    <div class="scene-grid">${SCENES.map((scene, i) => `<button class="scene-option" data-scene-option="${scene}" aria-pressed="false"><img alt="" src="${thumbnail(scene)}"/><span><small>0${i + 1}</small><strong>${SCENE_INFO[scene].name}</strong><span class="scene-check">${icon("check", 16)}</span></span></button>`).join("")}</div>
    <label class="switch-row"><span><strong>Let the scenery wander</strong><small>Move to a new scene every four variations.</small></span><input id="rotate" type="checkbox" role="switch"/></label>
  </dialog>
  <dialog id="mixer-dialog" aria-labelledby="mixer-dialog-title">
    <div class="mixer-heading">
    <div class="dialog-heading"><div><p class="eyebrow">Make a little space</p><h2 id="mixer-dialog-title">Your ensemble.</h2></div><button class="icon-button" data-close aria-label="Close ensemble">${icon("close")}</button></div>
    <div class="dialog-change" aria-hidden="true"><span class="dialog-change-mark">${logo}</span><div><small data-change-label></small><strong data-change-title></strong><span data-change-detail></span></div></div>
    </div>
    <label class="preset-label" for="preset">Start with a feeling</label><select id="preset">${options(Object.keys(PRESETS))}<option value="custom">Custom mix</option></select>
    <div class="layer-list">${LAYERS.map((layer) => {
      const names = {
        melody: ["Canon voices", "Three melodies, following one another"],
        bass: ["Ground bass", "The familiar heartbeat underneath"],
        chords: ["Soft keys", "A little harmonic warmth"],
        pad: ["Warm strings", "A long, gentle breath"],
        pizzicato: ["Plucked strings", "Small, playful footsteps"],
        nature: ["Nature air", "A soft, scene-colored wash of wind"],
        beat: ["Soft drums", "A laid-back kick, snare and hi-hat"],
        vinyl: ["Vinyl texture", "A little hiss and a gentle crackle"],
      };
      return `<div class="layer-row"><label class="layer-label" for="toggle-${layer}"><strong>${names[layer][0]}</strong><small>${names[layer][1]}</small></label><input id="toggle-${layer}" type="checkbox" role="switch" aria-label="Enable ${names[layer][0]}"/><input id="layer-${layer}" type="range" min="0" max="100" aria-label="${names[layer][0]} volume"/><output id="value-${layer}" for="layer-${layer}"></output></div>`;
    }).join("")}</div>
    <p class="dialog-note">Synthesized instruments, made here in your browser. All layers follow the same harmony.</p>
  </dialog>
  <dialog id="saved-dialog" aria-labelledby="saved-dialog-title">
    <div class="dialog-heading"><div><p class="eyebrow">Little things worth keeping</p><h2 id="saved-dialog-title">Saved moments.</h2></div><button class="icon-button" data-close aria-label="Close saved moments">${icon("close")}</button></div>
    <div id="favorite-list"></div><p class="dialog-note">Saved on this device. Share a link to keep a moment elsewhere.</p>
    <button id="new-session" class="solid-button">${icon("shuffle", 17)}Start a new composition</button>
  </dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-dialog-title">
    <div class="dialog-heading"><div><p class="eyebrow">A familiar kind of new</p><h2 id="about-dialog-title">A canon without an end.</h2></div><button class="icon-button" data-close aria-label="Close about">${icon("close")}</button></div>
    <p>Eight chords. Three voices. A melody that finds a new path each time.</p>
    <p>Endless Canon takes the harmony of Pachelbel’s Canon in D and composes new phrases as you listen. Each voice echoes the one before it, a full four-bar cycle later. The music grows from calm to flowing, lively to playful, before finding room to breathe again.</p>
    <div class="about-facts"><span>Made in your browser</span><span>No account. No tracking.</span><span>Headphones welcome</span></div>
    <p>Your session is a seed. Save or share it to revisit the same composition and settings, starting from the current variation. Switch Style to Lo-fi for warm electric piano, swung phrases, soft drums and vinyl texture. Changes to style, key, mood or movement begin that variation again.</p>
    <p class="dialog-note">Keyboard: Space to play or pause, ← to rewind, Z for zen mode, Escape to return. Controls keep their normal keyboard behavior. Recordings contain only the generated music, never your microphone.</p>
    <a class="source-link" href="https://github.com/wildanniam/canon-endless" target="_blank" rel="noopener noreferrer">Made with care · View the source ${icon("arrow", 14)}</a>
  </dialog>
  <dialog id="share-dialog" aria-labelledby="share-dialog-title">
    <div class="dialog-heading"><h2 id="share-dialog-title">A moment to pass on.</h2><button class="icon-button" data-close aria-label="Close share">${icon("close")}</button></div>
    <label for="share-url">Copy this link to replay the same composition and settings.</label><input id="share-url" type="text" readonly/><button id="copy-link" class="solid-button">${icon("share", 17)}Copy link</button>
  </dialog>
`;

const landscape = new Landscape($("#landscape"));
const feedback = new ChangeFeedback();
let favorites: Favorite[] = [];
try {
  favorites = readFavorites(localStorage);
} catch {
  /* Storage can be unavailable. */
}
let toastTimeout: ReturnType<typeof setTimeout>;
let zen = false;
let busy = false;
let hasPlayed = false;
let lastAutoCycle = settings.cycle;
const lastVolume: Partial<Record<Layer, number>> = {};
let lastRecordSeed = settings.seed;

function toast(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(
    () => $("#toast").classList.remove("visible"),
    4500,
  );
}
function openDialog(id: string) {
  openPanel($<HTMLDialogElement>(id));
}
document
  .querySelectorAll<HTMLButtonElement>("[data-close]")
  .forEach(
    (button) => (button.onclick = () => closePanel(button.closest("dialog")!)),
  );
document.querySelectorAll<HTMLDialogElement>("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closePanel(dialog);
  }),
);
document.querySelectorAll<HTMLDialogElement>("dialog").forEach((dialog) =>
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePanel(dialog);
  }),
);

function renderProgression(active = -1) {
  const applied = player.activeSettings;
  const chords = progression(applied.key, applied.mood);
  const container = $("#progression");
  if (!container.children.length)
    container.innerHTML = chords
      .map(() => '<div class="chord"><strong></strong><small></small></div>')
      .join("");
  Array.from(container.children).forEach((element, i) => {
    element.querySelector("strong")!.textContent = chords[i].name;
    element.querySelector("small")!.textContent = chords[i].roman;
    element.classList.toggle("current", i === active);
    if (i === active) element.setAttribute("aria-current", "true");
    else element.removeAttribute("aria-current");
  });
  $("#track-subtitle").textContent =
    `${applied.style === "lofi" ? "Lo-fi Canon" : "Canon"} in ${applied.key} ${applied.mood === "wistful" ? "minor" : "major"}`;
}
function paintRanges() {
  document
    .querySelectorAll<HTMLInputElement>('input[type="range"]')
    .forEach((input) => {
      input.style.setProperty(
        "--fill",
        `${((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100}%`,
      );
    });
}
function setScene(scene: Scene, animate = true, announce = true) {
  const previous = document.body.dataset.scene;
  settings.scene = scene;
  document.body.dataset.scene = scene;
  document.documentElement.dataset.scene = scene;
  landscape.setScene(scene, animate);
  player.update(settings);
  $("#scene-name").textContent = SCENE_INFO[scene].name;
  $("#scene-place").textContent = SCENE_INFO[scene].place;
  $("#scene-number").textContent = `0${SCENES.indexOf(scene) + 1}`;
  $<HTMLImageElement>("#scene-preview").src = thumbnail(scene);
  document
    .querySelectorAll<HTMLButtonElement>("[data-scene-option]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.sceneOption === scene),
      ),
    );
  if (announce && previous && previous !== scene)
    feedback.show(
      SCENE_INFO[scene].name,
      SCENE_INFO[scene].place,
      "scene",
      1300,
    );
}
function renderFavoriteState() {
  const saved = favorites.some((f) => f.seed === settings.seed);
  $("#favorite").setAttribute("aria-pressed", String(saved));
  $("#favorite").setAttribute(
    "aria-label",
    saved ? "Remove saved session" : "Save this session",
  );
}
function updateStatus() {
  const cycle = player.cycle;
  const stage = stageAt(settings.seed, cycle);
  $("#cycle-label").textContent =
    `Variation ${String(cycle + 1).padStart(3, "0")}`;
  $("#stage-label").textContent = player.playing
    ? `${STAGES[stage]} waters`
    : hasPlayed
      ? "A moment of stillness"
      : "Ready when you are";
  if (player.playing)
    $("#stage-label").textContent =
      STAGES[stage] +
      (stage === 5 ? " · Room to breathe" : " · Finding its way");
  $("#voice-label").textContent = hasPlayed
    ? `${Math.min(cycle + 1, stage === 5 ? 2 : 3)} ${cycle === 0 ? "voice" : "voices"} in conversation`
    : "One melody, unfolding";
  $<HTMLButtonElement>("#rewind").disabled = cycle === 0;
}
function renderTransport() {
  const playing = player.playing;
  $("#play").innerHTML = icon(playing ? "pause" : "play", 27);
  $("#play").setAttribute("aria-label", playing ? "Pause music" : "Play music");
  $("#play-label").textContent = playing
    ? "Let it unfold"
    : hasPlayed
      ? "Continue listening"
      : "Begin listening";
  $("#playing-dot").classList.toggle("active", playing);
  landscape.setPlaying(playing);
  updateStatus();
}
async function togglePlay() {
  if (busy) return;
  busy = true;
  $<HTMLButtonElement>("#play").disabled = true;
  try {
    if (player.playing) await player.pause();
    else {
      await player.play();
      hasPlayed = true;
    }
  } catch (error) {
    toast(
      error instanceof Error
        ? error.message
        : "Audio could not start. Please try again.",
    );
  } finally {
    busy = false;
    $<HTMLButtonElement>("#play").disabled = false;
    renderTransport();
  }
}

$("#play").onclick = () => void togglePlay();
player.onInterrupted = () => {
  renderTransport();
  toast("Audio was interrupted. Press Play to continue.");
};
player.onSettingsApplied = () => {
  renderProgression();
  updateStatus();
};
function rewind() {
  if (player.cycle === 0) return;
  player.seek(Math.max(0, player.cycle - 1));
  renderProgression();
  updateStatus();
  feedback.show(
    "A moment worth revisiting",
    "Returning to the previous variation.",
  );
}
$("#rewind").onclick = rewind;
for (const name of ["tempo", "density", "volume"] as const) {
  $<HTMLInputElement>(`#${name}`).oninput = (event) => {
    settings[name] = Number((event.target as HTMLInputElement).value);
    $(`#${name}-value`).textContent =
      `${settings[name]}${name === "tempo" ? " bpm" : name === "volume" ? "%" : ""}`;
    paintRanges();
    if (name !== "density") player.update(settings, false);
  };
  $<HTMLInputElement>(`#${name}`).onchange = () => {
    if (name === "density") {
      player.update(settings, true);
      feedback.show(
        settings.density > 60 ? "A little more movement" : "Room to breathe",
        `Movement · ${settings.density}%`,
      );
    } else if (name === "tempo")
      feedback.show(
        "A different pace",
        `${settings.tempo} beats per minute`,
        "music",
        950,
      );
    else
      feedback.show(
        settings.volume === 0
          ? "A moment of quiet"
          : `Volume · ${settings.volume}%`,
        "Let the sound settle in.",
        "music",
        800,
      );
  };
}
$<HTMLSelectElement>("#key").onchange = (event) => {
  settings.key = (event.target as HTMLSelectElement).value as Key;
  player.update(settings, true);
  feedback.show(
    `${settings.key} ${settings.mood === "wistful" ? "minor" : "major"}`,
    "Same melody, a different light.",
  );
};
$<HTMLSelectElement>("#mood").onchange = (event) => {
  settings.mood = (event.target as HTMLSelectElement).value as Mood;
  if (settings.mood === "dreamy") {
    settings.tempo = 56;
    $<HTMLInputElement>("#tempo").value = "56";
    $("#tempo-value").textContent = "56 bpm";
  }
  player.update(settings, true);
  paintRanges();
  feedback.show(
    {
      bright: "A brighter feeling",
      dreamy: "Somewhere dreamier",
      wistful: "A little wistful",
    }[settings.mood],
    `${settings.key} ${settings.mood === "wistful" ? "minor" : "major"} · ${settings.tempo} bpm`,
  );
};
function chooseStyle(style: MusicStyle, kind: "music" | "mix" = "music") {
  settings.style = style;
  settings.mix = {
    ...PRESETS[style === "lofi" ? "Lo-fi afternoon" : "Classic quartet"],
  };
  settings.tempo = style === "lofi" ? 68 : 72;
  $<HTMLSelectElement>("#style").value = style;
  $<HTMLInputElement>("#tempo").value = String(settings.tempo);
  $("#tempo-value").textContent = `${settings.tempo} bpm`;
  player.update(settings, true);
  renderMixer();
  paintRanges();
  feedback.show(
    style === "lofi" ? "A lo-fi afternoon" : "Back to the classics",
    style === "lofi"
      ? "Warm keys, a soft beat, nowhere to rush."
      : "Three familiar voices, unfolding.",
    kind,
  );
}
$<HTMLSelectElement>("#style").onchange = (event) =>
  chooseStyle((event.target as HTMLSelectElement).value as MusicStyle);
$("#scenes").onclick = () => openDialog("#scene-dialog");
document.querySelectorAll<HTMLButtonElement>("[data-scene-option]").forEach(
  (button) =>
    (button.onclick = () => {
      setScene(button.dataset.sceneOption as Scene);
      closePanel($<HTMLDialogElement>("#scene-dialog"));
    }),
);
$<HTMLInputElement>("#rotate").onchange = (event) => {
  settings.rotate = (event.target as HTMLInputElement).checked;
  lastAutoCycle = player.cycle;
};

function renderMixer() {
  for (const layer of LAYERS) {
    $<HTMLInputElement>(`#toggle-${layer}`).checked = settings.mix[layer] > 0;
    $<HTMLInputElement>(`#layer-${layer}`).value = String(settings.mix[layer]);
    $(`#value-${layer}`).textContent = `${settings.mix[layer]}%`;
  }
  $<HTMLSelectElement>("#preset").value =
    Object.keys(PRESETS).find((name) =>
      LAYERS.every((layer) => PRESETS[name][layer] === settings.mix[layer]),
    ) || "custom";
  paintRanges();
}
$("#mixer").onclick = () => {
  renderMixer();
  openDialog("#mixer-dialog");
};
$<HTMLSelectElement>("#preset").onchange = (event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (!PRESETS[value]) return;
  if (value === "Lo-fi afternoon") {
    chooseStyle("lofi", "mix");
    return;
  }
  settings.mix = { ...PRESETS[value] };
  player.update(settings);
  renderMixer();
  feedback.show(value, "The voices find their balance.", "mix", 950);
};
for (const layer of LAYERS) {
  $<HTMLInputElement>(`#toggle-${layer}`).onchange = (event) => {
    if ((event.target as HTMLInputElement).checked)
      settings.mix[layer] = lastVolume[layer] || 40;
    else {
      lastVolume[layer] = settings.mix[layer];
      settings.mix[layer] = 0;
    }
    player.update(settings);
    renderMixer();
    feedback.show(
      "A new balance",
      settings.mix[layer] > 0
        ? "Another voice joins the moment."
        : "Leaving a little more space.",
      "mix",
      850,
    );
  };
  $<HTMLInputElement>(`#layer-${layer}`).oninput = (event) => {
    settings.mix[layer] = Number((event.target as HTMLInputElement).value);
    player.update(settings);
    renderMixer();
  };
  $<HTMLInputElement>(`#layer-${layer}`).onchange = () => {
    const name = $<HTMLInputElement>(`#layer-${layer}`)
      .getAttribute("aria-label")!
      .replace(" volume", "");
    feedback.show(
      `${name} · ${settings.mix[layer]}%`,
      "The ensemble settles around you.",
      "mix",
      850,
    );
  };
}

function persistFavorites(next: Favorite[]) {
  try {
    localStorage.setItem("endless-canon:favorites:v1", JSON.stringify(next));
    favorites = next;
    renderFavoriteState();
    return true;
  } catch {
    toast("This browser cannot save locally. Use a share link instead.");
    return false;
  }
}
function currentUrl() {
  return sessionUrl({ ...settings, cycle: player.cycle }, location.href);
}
$("#favorite").onclick = () => {
  if (favorites.some((f) => f.seed === settings.seed)) {
    if (persistFavorites(favorites.filter((f) => f.seed !== settings.seed)))
      toast("Removed from saved moments.");
  } else {
    const entry = {
      seed: settings.seed,
      query: new URL(currentUrl()).search,
      savedAt: new Date().toISOString(),
    };
    if (persistFavorites([entry, ...favorites].slice(0, 20)))
      toast("Moment saved on this device.");
  }
};
function renderFavorites() {
  const list = $("#favorite-list");
  list.replaceChildren();
  if (!favorites.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent =
      "Nothing here just yet. Tap the heart when a moment feels like yours.";
    list.append(p);
  }
  for (const favorite of favorites) {
    const item = document.createElement("div");
    item.className = "favorite-row";
    const load = document.createElement("button");
    load.className = "favorite-load";
    const title = document.createElement("strong");
    title.textContent = favorite.seed;
    const detail = document.createElement("small");
    const config = parseSettings(favorite.query);
    detail.textContent = `${config.key} ${config.mood === "wistful" ? "minor" : "major"} · ${SCENE_INFO[config.scene].name} · variation ${config.cycle + 1}`;
    load.append(title, detail);
    load.onclick = () => {
      void loadSession(favorite.query);
      closePanel($<HTMLDialogElement>("#saved-dialog"));
    };
    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.setAttribute("aria-label", `Remove ${favorite.seed}`);
    remove.innerHTML = icon("trash", 17);
    remove.onclick = () => {
      if (persistFavorites(favorites.filter((f) => f !== favorite)))
        renderFavorites();
    };
    item.append(load, remove);
    list.append(item);
  }
}
$("#saved").onclick = () => {
  renderFavorites();
  openDialog("#saved-dialog");
};
$("#new-session").onclick = () => {
  void loadSession(`?seed=${newSeed()}`);
  closePanel($<HTMLDialogElement>("#saved-dialog"));
};
async function loadSession(query: string) {
  if (busy) return;
  busy = true;
  try {
    player.stopRecording();
    await player.pause();
    settings = parseSettings(query);
    player.update(settings, true);
    player.seek(settings.cycle);
    history.replaceState(null, "", sessionUrl(settings, location.href));
    lastAutoCycle = settings.cycle;
    hasPlayed = false;
    syncSettings(true);
    renderTransport();
    feedback.show(
      "An endless beginning",
      "Your composition is ready. Press Play to begin.",
    );
  } catch {
    toast("This session could not be loaded. Please try again.");
  } finally {
    busy = false;
  }
}

async function copyLink() {
  const url = currentUrl();
  $<HTMLInputElement>("#share-url").value = url;
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied. A little calm to pass on.");
  } catch {
    if (!$<HTMLDialogElement>("#share-dialog").open)
      openDialog("#share-dialog");
    $<HTMLInputElement>("#share-url").select();
  }
}
$("#share").onclick = () => void copyLink();
$("#copy-link").onclick = () => void copyLink();
$("#about").onclick = () => openDialog("#about-dialog");

function setZen(value: boolean) {
  zen = value;
  document.body.classList.toggle("zen", zen);
  $(".chrome").inert = zen;
  $("#exit-zen").hidden = !zen;
  if (zen) $("#exit-zen").focus();
  else $("#zen").focus();
}
$("#zen").onclick = () => setZen(true);
$("#exit-zen").onclick = () => setZen(false);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && zen) {
    setZen(false);
    return;
  }
  const target = event.target as HTMLElement;
  if (
    target.closest('input,select,textarea,button,a,[contenteditable="true"]') ||
    document.querySelector("dialog[open]") ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.repeat
  )
    return;
  if (event.code === "Space") {
    event.preventDefault();
    void togglePlay();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    rewind();
  }
  if (event.key.toLowerCase() === "z") setZen(!zen);
});

$("#record").onclick = () => {
  if (player.recording) {
    player.stopRecording();
    return;
  }
  try {
    player.startRecording();
    lastRecordSeed = settings.seed;
    $("#record").classList.add("recording");
    $("#record").innerHTML = `${icon("stop", 16)}<span>Save audio</span>`;
    toast(
      "Recording the music. Tap Save audio when you’re ready (5 min maximum).",
    );
  } catch (error) {
    toast(
      error instanceof Error ? error.message : "Recording could not start.",
    );
  }
};
player.onRecordingEnd = (blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `endless-canon-${lastRecordSeed}.${blob.type.includes("mp4") ? "m4a" : "webm"}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  $("#record").classList.remove("recording");
  $("#record").innerHTML = `${icon("record", 16)}<span>Record</span>`;
  toast("Your recording is ready.");
};
if (typeof MediaRecorder === "undefined") {
  $<HTMLButtonElement>("#record").disabled = true;
  $("#record").title = "Audio recording is unavailable in this browser";
}

player.events.on((event) => {
  landscape.event(event);
  if (event.kind === "chord") renderProgression(event.chord);
  if (event.kind === "cycle") {
    updateStatus();
    if (
      settings.rotate &&
      event.cycle > 0 &&
      event.cycle % 4 === 0 &&
      event.cycle !== lastAutoCycle
    ) {
      setScene(SCENES[(SCENES.indexOf(settings.scene) + 1) % SCENES.length]);
      lastAutoCycle = event.cycle;
    }
  }
});
function syncSettings(animate = false) {
  for (const name of ["tempo", "density", "volume"] as const) {
    $<HTMLInputElement>(`#${name}`).value = String(settings[name]);
    $(`#${name}-value`).textContent =
      `${settings[name]}${name === "tempo" ? " bpm" : name === "volume" ? "%" : ""}`;
  }
  $<HTMLSelectElement>("#key").value = settings.key;
  $<HTMLSelectElement>("#mood").value = settings.mood;
  $<HTMLSelectElement>("#style").value = settings.style;
  $<HTMLInputElement>("#rotate").checked = settings.rotate;
  setScene(settings.scene, animate, false);
  renderMixer();
  renderProgression();
  renderFavoriteState();
  updateStatus();
}
syncSettings();
if (
  new URLSearchParams(location.search).has("v") &&
  new URLSearchParams(location.search).get("v") !== "1"
)
  toast("This link uses a different composition version. Playback may differ.");
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    feedback.dispose();
    landscape.dispose();
    void player.dispose();
  });
