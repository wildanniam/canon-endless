import { beatAt, tickStretch } from "../music/lofi";
import TimerWorker from "./timer.worker?worker";
import { SoundBank } from "./synth";
import { Canon, stageAt } from "../music/composer";
import { progression, TICKS_PER_CYCLE } from "../music/theory";
import { MusicEvents } from "../events";
import type { MusicEvent } from "../events";
import type { Settings } from "../settings";

export class Player {
  readonly events = new MusicEvents();
  private context?: AudioContext;
  private bank?: SoundBank;
  private timer?: Worker;
  private canon = new Canon();
  private tick = 0;
  private nextTime = 0;
  private queue: MusicEvent[] = [];
  private frame = 0;
  private audibleCycle = 0;
  private running = false;
  private starting = false;
  private pendingSettings?: Settings;
  private pendingCycle?: number;
  private changeAt?: number;
  private tempoFrom: number;
  private tempoStarted = 0;
  private recorder?: MediaRecorder;
  private recordingOutput?: MediaStreamAudioDestinationNode;
  private recordingTimeout?: ReturnType<typeof setTimeout>;
  onRecordingEnd?: (blob: Blob) => void;
  onInterrupted?: () => void;
  onSettingsApplied?: () => void;

  constructor(private settings: Settings) {
    this.settings = structuredClone(settings);
    this.tempoFrom = settings.tempo;
    this.tick = settings.cycle * TICKS_PER_CYCLE;
    this.audibleCycle = settings.cycle;
  }

  get playing() {
    return this.running;
  }
  get cycle() {
    return this.audibleCycle;
  }
  get activeSettings() {
    return structuredClone(this.settings);
  }
  get recording() {
    return (
      this.recorder?.state === "recording" || this.recorder?.state === "paused"
    );
  }
  get diagnostics() {
    return {
      playing: this.running,
      context: this.context?.state || "uninitialized",
      cycle: this.cycle,
      scheduledTick: this.tick,
      queuedEvents: this.queue.length,
      cachedPhrases: this.canon.size,
      activeOscillators: this.bank?.activeNodes || 0,
      transitioning: this.pendingSettings !== undefined,
      key: this.settings.key,
      mood: this.settings.mood,
      density: this.settings.density,
      style: this.settings.style,
      tempo: this.tempoAt(this.context?.currentTime || 0),
    };
  }
  get level(): number {
    if (!this.bank || !this.running) return 0;
    const buffer = new Uint8Array(this.bank.analyser.fftSize);
    this.bank.analyser.getByteTimeDomainData(buffer);
    return Math.sqrt(
      buffer.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) /
        buffer.length,
    );
  }

  async play() {
    if (this.running || this.starting) return;
    this.starting = true;
    try {
      if (!this.context) {
        this.context = new AudioContext({ latencyHint: "playback" });
        this.bank = new SoundBank(this.context);
        this.bank.mix(
          this.settings.mix,
          this.settings.volume,
          this.settings.mood === "dreamy",
        );
        this.bank.setStyle(this.settings.style);
        this.bank.scene(this.settings.scene);
        this.timer = new TimerWorker();
        this.timer.onmessage = () => this.schedule();
        this.context.onstatechange = () => {
          if (this.running && this.context?.state !== "running") {
            this.running = false;
            this.timer?.postMessage(false);
            cancelAnimationFrame(this.frame);
            this.commitChange();
            if (this.recorder?.state === "recording") this.recorder.pause();
            this.onInterrupted?.();
          }
        };
      }
      this.bank!.fadeTo(0, 0);
      await this.context.resume();
      if (this.context.state !== "running")
        throw new Error("Audio could not start. Please press Play again.");
      this.nextTime = Math.max(this.nextTime, this.context.currentTime + 0.06);
      this.running = true;
      this.bank!.fadeTo(1, 0.55);
      if (this.recorder?.state === "paused") this.recorder.resume();
      this.timer!.postMessage(true);
      this.schedule();
      this.flushVisuals();
    } finally {
      this.starting = false;
    }
  }

  async pause() {
    this.running = false;
    this.timer?.postMessage(false);
    cancelAnimationFrame(this.frame);
    if (this.recorder?.state === "recording") this.recorder.pause();
    await this.context?.suspend();
    this.commitChange();
  }

  update(settings: Settings, restart = false) {
    const next = structuredClone(settings);
    if (restart) {
      if (this.running && this.context)
        this.queueChange(next, this.pendingCycle ?? this.cycle);
      else {
        this.pendingSettings = undefined;
        this.pendingCycle = undefined;
        this.changeAt = undefined;
        this.applySettings(next);
        this.resetPosition(this.cycle);
        this.bank?.fadeTo(1, 0);
        this.onSettingsApplied?.();
      }
      return;
    }
    // A volume/scene update must never prematurely apply a pending tonal change
    // or an uncommitted density slider drag.
    const realtime = {
      tempo: next.tempo,
      volume: next.volume,
      mix: next.mix,
      scene: next.scene,
      rotate: next.rotate,
    };
    if (this.pendingSettings)
      this.pendingSettings = { ...this.pendingSettings, ...realtime };
    this.applySettings({ ...this.settings, ...realtime });
  }

  seek(cycle: number) {
    const target = Math.max(0, Math.floor(cycle));
    if (this.running && this.context)
      this.queueChange(this.pendingSettings || this.settings, target);
    else this.resetPosition(target);
  }

  private tempoAt(time: number) {
    const progress = Math.min(1, Math.max(0, (time - this.tempoStarted) / 0.9));
    const eased = progress * progress * (3 - 2 * progress);
    return this.tempoFrom + (this.settings.tempo - this.tempoFrom) * eased;
  }

  private applySettings(next: Settings) {
    if (next.tempo !== this.settings.tempo) {
      this.tempoFrom = this.running
        ? this.tempoAt(this.context!.currentTime)
        : next.tempo;
      this.tempoStarted = this.context?.currentTime || 0;
    }
    this.settings = structuredClone(next);
    this.bank?.mix(next.mix, next.volume, next.mood === "dreamy");
    this.bank?.setStyle(next.style);
    this.bank?.scene(next.scene);
  }

  private queueChange(next: Settings, cycle: number) {
    this.pendingSettings = structuredClone(next);
    this.pendingCycle = cycle;
    // Coalesce rapid input into the same fade-out; do not schedule stale timers.
    if (this.changeAt === undefined) {
      this.changeAt = this.context!.currentTime + 0.3;
      this.bank!.fadeTo(0, 0.26);
    }
  }

  private commitChange() {
    if (!this.pendingSettings) return;
    const next = this.pendingSettings;
    const cycle = this.pendingCycle ?? this.cycle;
    this.pendingSettings = undefined;
    this.pendingCycle = undefined;
    this.changeAt = undefined;
    this.applySettings(next);
    this.resetPosition(cycle);
    this.bank?.fadeTo(1, this.running ? 0.85 : 0);
    this.onSettingsApplied?.();
  }

  private resetPosition(cycle: number) {
    this.audibleCycle = Math.max(0, Math.floor(cycle));
    this.tick = this.audibleCycle * TICKS_PER_CYCLE;
    this.queue = [];
    this.bank?.silence();
    this.nextTime = (this.context?.currentTime || 0) + 0.06;
  }

  private schedule() {
    if (!this.running || !this.context || !this.bank) return;
    if (
      this.changeAt !== undefined &&
      this.context.currentTime >= this.changeAt
    )
      this.commitChange();
    // Recover from system sleep without scheduling a burst of overdue notes.
    if (this.nextTime < this.context.currentTime - 0.15) {
      this.nextTime = this.context.currentTime + 0.06;
      this.queue = [];
    }
    const chords = progression(this.settings.key, this.settings.mood);
    const horizon = Math.min(
      this.context.currentTime + 0.18,
      this.changeAt ?? Infinity,
    );
    while (this.nextTime < horizon) {
      const tickSeconds = 60 / this.tempoAt(this.nextTime) / 4;
      const cycle = Math.floor(this.tick / TICKS_PER_CYCLE);
      const local = this.tick % TICKS_PER_CYCLE;
      const chordIndex = Math.floor(local / 8);
      const chord = chords[chordIndex];
      const stage = stageAt(this.settings.seed, cycle);
      const time = this.nextTime;
      if (this.settings.mix.beat > 0) {
        for (const hit of beatAt(local, stage === 5)) {
          this.bank.drum(hit.drum, time, hit.velocity);
          if (hit.drum === "kick")
            this.queue.push({ kind: "beat", time, cycle, stage });
        }
      }
      if (local === 0) this.queue.push({ kind: "cycle", time, cycle, stage });
      if (local % 8 === 0) {
        this.queue.push({
          kind: "chord",
          time,
          cycle,
          stage,
          chord: chordIndex,
        });
        this.bank.note(36 + chord.root, time, tickSeconds * 7.5, "bass", 0.75);
        chord.notes.forEach((pitch, i) => {
          this.bank!.note(
            48 + pitch + (pitch < chord.root ? 12 : 0),
            time + i * 0.025,
            tickSeconds * 5,
            "chords",
            0.5,
          );
          this.bank!.note(60 + pitch, time, tickSeconds * 8, "pad", 0.45);
        });
      }
      if (local % 4 === 0)
        this.bank.note(
          60 + chord.notes[Math.floor(local / 4) % 3],
          time,
          tickSeconds * 2,
          "pizzicato",
          0.45,
        );
      for (const note of this.canon.notesAt(this.settings, cycle, local)) {
        this.bank.note(
          note.midi,
          time,
          note.duration * tickSeconds,
          "melody",
          note.velocity * (note.voice ? 0.65 : 1),
          note.voice,
        );
        this.queue.push({
          kind: "note",
          time,
          cycle,
          stage,
          midi: note.midi,
          voice: note.voice,
        });
      }
      this.tick++;
      this.nextTime +=
        tickSeconds * tickStretch(local, this.settings.style === "lofi");
    }
    // Background tabs can stop RAF; visual backlog must not grow indefinitely.
    if (this.queue.length > 256) this.queue.splice(0, this.queue.length - 256);
  }

  private flushVisuals = () => {
    if (!this.running || !this.context) return;
    const audible =
      this.context.currentTime - (this.context.outputLatency || 0);
    while (this.queue[0] && this.queue[0].time <= audible) {
      const event = this.queue.shift()!;
      this.audibleCycle = event.cycle;
      this.events.emit(event);
    }
    this.frame = requestAnimationFrame(this.flushVisuals);
  };

  startRecording() {
    if (!this.context || !this.bank || !this.running)
      throw new Error("Press Play before recording.");
    if (typeof MediaRecorder === "undefined")
      throw new Error("Recording is not supported in this browser.");
    if (this.recording) return;
    const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
      (type) => MediaRecorder.isTypeSupported(type),
    );
    if (!mime)
      throw new Error("This browser has no supported audio recording format.");
    this.recordingOutput ??= this.context.createMediaStreamDestination();
    this.bank.output.connect(this.recordingOutput);
    this.recorder = new MediaRecorder(this.recordingOutput.stream, {
      mimeType: mime,
    });
    const chunks: Blob[] = [];
    this.recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    this.recorder.onstop = () => {
      try {
        this.bank?.output.disconnect(this.recordingOutput!);
      } catch {
        /* Graph may already be disposed during HMR. */
      }
      clearTimeout(this.recordingTimeout);
      this.onRecordingEnd?.(new Blob(chunks, { type: mime }));
    };
    this.recorder.start(1000);
    this.recordingTimeout = setTimeout(
      () => this.stopRecording(),
      5 * 60 * 1000,
    );
  }

  stopRecording() {
    if (this.recording) this.recorder!.stop();
  }

  async dispose() {
    this.stopRecording();
    clearTimeout(this.recordingTimeout);
    await this.pause();
    this.timer?.terminate();
    this.bank?.dispose();
    await this.context?.close();
  }
}
