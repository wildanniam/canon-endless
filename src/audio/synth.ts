import type { Drum } from "../music/lofi";
import type { MusicStyle } from "../music/composer";
import { frequency } from "../music/theory";
import { random } from "../music/random";
import { LAYERS } from "../settings";
import type { Layer, Mix, Scene } from "../settings";

/** Shared audio graph; all temporary oscillator/envelope nodes disconnect on end. */
export class SoundBank {
  readonly master: GainNode;
  readonly analyser: AnalyserNode;
  readonly output: WaveShaperNode;
  private transitionGain: GainNode;
  private tone: BiquadFilterNode;
  private style: MusicStyle = "classic";
  private vinyl: AudioBufferSourceNode;
  private drumNoise: AudioBuffer;
  private layers = new Map<Layer, GainNode>();
  private active = new Set<OscillatorNode | AudioBufferSourceNode>();
  private ambience: AudioBufferSourceNode;
  private ambienceFilter: BiquadFilterNode;
  private reverb: ConvolverNode;
  private wet: GainNode;
  private compressor: DynamicsCompressorNode;
  private noiseVolume: GainNode;
  get activeNodes() {
    return this.active.size;
  }

  constructor(private context: BaseAudioContext) {
    this.master = context.createGain();
    this.master.gain.value = 0;
    this.transitionGain = context.createGain();
    this.tone = context.createBiquadFilter();
    this.tone.type = "lowpass";
    this.tone.frequency.value = Math.min(20000, context.sampleRate * 0.45);
    this.tone.Q.value = 0.45;
    this.compressor = context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 16;
    this.compressor.ratio.value = 5;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.2;
    this.output = context.createWaveShaper();
    this.output.curve = Float32Array.from(
      { length: 4096 },
      (_, i) => Math.tanh(((i / 4095) * 2 - 1) * 1.1) * 0.88,
    );
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256;
    this.compressor
      .connect(this.tone)
      .connect(this.transitionGain)
      .connect(this.master)
      .connect(this.output)
      .connect(this.analyser)
      .connect(context.destination);

    this.reverb = context.createConvolver();
    const impulse = context.createBuffer(
      2,
      context.sampleRate * 2.4,
      context.sampleRate,
    );
    const rng = random("canon-room-v1");
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < data.length; i++)
        data[i] = (rng() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.45));
    }
    this.reverb.buffer = impulse;
    this.wet = context.createGain();
    this.wet.gain.value = 0.22;
    this.reverb.connect(this.wet).connect(this.compressor);
    for (const layer of LAYERS) {
      const gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(this.compressor);
      if (!["nature", "bass", "beat", "vinyl"].includes(layer))
        gain.connect(this.reverb);
      this.layers.set(layer, gain);
    }

    const noise = context.createBuffer(
      1,
      context.sampleRate * 4,
      context.sampleRate,
    );
    const data = noise.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      brown = (brown + (rng() * 2 - 1) * 0.025) / 1.025;
      data[i] = brown * 2;
    }
    this.ambience = context.createBufferSource();
    this.ambience.buffer = noise;
    this.ambience.loop = true;
    this.ambienceFilter = context.createBiquadFilter();
    this.ambienceFilter.type = "lowpass";
    this.ambienceFilter.frequency.value = 650;
    this.noiseVolume = context.createGain();
    this.noiseVolume.gain.value = 0.35;
    this.ambience
      .connect(this.ambienceFilter)
      .connect(this.noiseVolume)
      .connect(this.layers.get("nature")!);
    this.ambience.start();

    this.drumNoise = context.createBuffer(
      1,
      context.sampleRate,
      context.sampleRate,
    );
    const drumData = this.drumNoise.getChannelData(0);
    for (let i = 0; i < drumData.length; i++) drumData[i] = rng() * 2 - 1;
    const vinylBuffer = context.createBuffer(
      1,
      context.sampleRate * 4,
      context.sampleRate,
    );
    const vinylData = vinylBuffer.getChannelData(0);
    let crackle = 0;
    for (let i = 0; i < vinylData.length; i++) {
      if (rng() < 3 / context.sampleRate) crackle = (rng() - 0.5) * 0.18;
      crackle *= 0.88;
      vinylData[i] = (rng() - 0.5) * 0.012 + crackle;
    }
    this.vinyl = context.createBufferSource();
    this.vinyl.buffer = vinylBuffer;
    this.vinyl.loop = true;
    this.vinyl.connect(this.layers.get("vinyl")!);
    this.vinyl.start();
  }

  mix(mix: Mix, volume: number, dreamy: boolean) {
    const time = this.context.currentTime;
    for (const layer of LAYERS)
      this.layers
        .get(layer)!
        .gain.setTargetAtTime((mix[layer] ?? 0) / 100, time, 0.18);
    this.master.gain.setTargetAtTime((volume / 100) * 0.7, time, 0.08);
    this.wet.gain.setTargetAtTime(dreamy ? 0.4 : 0.22, time, 0.22);
  }

  setStyle(style: MusicStyle) {
    this.style = style;
    this.tone.frequency.setTargetAtTime(
      style === "lofi" ? 3400 : Math.min(20000, this.context.sampleRate * 0.45),
      this.context.currentTime,
      0.15,
    );
  }

  drum(drum: Drum, time: number, velocity: number) {
    const envelope = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const duration = drum === "kick" ? 0.3 : drum === "snare" ? 0.18 : 0.06;
    const source =
      drum === "kick"
        ? this.context.createOscillator()
        : this.context.createBufferSource();
    if ("frequency" in source) {
      source.type = "sine";
      source.frequency.setValueAtTime(140, time);
      source.frequency.exponentialRampToValueAtTime(46, time + 0.12);
      filter.type = "lowpass";
      filter.frequency.value = 900;
    } else {
      source.buffer = this.drumNoise;
      filter.type = "highpass";
      filter.frequency.value = drum === "hat" ? 6500 : 1300;
    }
    const level =
      velocity * (drum === "kick" ? 0.38 : drum === "snare" ? 0.14 : 0.075);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    envelope.gain.linearRampToValueAtTime(0, time + duration + 0.01);
    source.connect(filter).connect(envelope).connect(this.layers.get("beat")!);
    this.active.add(source);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
      this.active.delete(source);
    };
    source.start(time);
    source.stop(time + duration + 0.015);
  }

  /** Independent of mix/master automation, including changes during a fade. */
  fadeTo(value: number, seconds: number) {
    const time = this.context.currentTime;
    const gain = this.transitionGain.gain;
    if (typeof gain.cancelAndHoldAtTime === "function")
      gain.cancelAndHoldAtTime(time);
    else {
      const current = gain.value;
      gain.cancelScheduledValues(time);
      gain.setValueAtTime(current, time);
    }
    if (seconds === 0) gain.setValueAtTime(value, time);
    else gain.linearRampToValueAtTime(value, time + seconds);
  }

  scene(scene: Scene) {
    const cutoffs = {
      lake: 650,
      forest: 420,
      mountain: 260,
      blossom: 500,
      aurora: 170,
      rain: 2200,
    };
    this.ambienceFilter.frequency.setTargetAtTime(
      cutoffs[scene],
      this.context.currentTime,
      0.5,
    );
  }

  note(
    midi: number,
    time: number,
    duration: number,
    layer: Layer,
    velocity = 0.7,
    voice = 0,
  ) {
    const electric =
      this.style === "lofi" && (layer === "melody" || layer === "chords");
    const isPad = layer === "pad";
    const isBass = layer === "bass";
    const isPluck = layer === "pizzicato";
    const partials = electric
      ? [1, 2, 3.01, 4]
      : isPad
        ? [1, 2]
        : isBass
          ? [1, 2, 3]
          : [1, 2, 3, 4];
    const release = isPad ? 1.2 : isPluck ? 0.15 : 0.6;
    const attack = electric ? 0.012 : isPad ? 0.3 : isBass ? 0.035 : 0.008;
    const hold = Math.max(attack + 0.02, duration * (isPluck ? 0.3 : 0.85));
    const amp =
      velocity *
      (isPad
        ? 0.045
        : isBass
          ? 0.11
          : layer === "chords"
            ? 0.065
            : isPluck
              ? 0.07
              : 0.13);
    const panner = this.context.createStereoPanner();
    panner.pan.value = layer === "melody" ? [-0.35, 0.32, 0][voice] : 0;
    panner.connect(this.layers.get(layer)!);
    let remaining = partials.length;
    partials.forEach((partial, i) => {
      const oscillator = this.context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency(midi) * partial;
      oscillator.detune.value = isPad ? (i === 0 ? -3 : 3) : voice * 1.5;
      if (electric) {
        const length = hold + release + 0.03;
        oscillator.detune.setValueCurveAtTime(
          Float32Array.from(
            { length: 24 },
            (_, n) =>
              Math.sin((time + (n / 23) * length) * 3.1) * 3 + voice * 1.5,
          ),
          time,
          length,
        );
      }
      const envelope = this.context.createGain();
      const level = amp / partial ** (electric ? 2.8 : isBass ? 1.7 : 2.3);
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(level, time + attack);
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, level * (isPad ? 0.8 : 0.28)),
        time + hold,
      );
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + hold + release);
      envelope.gain.linearRampToValueAtTime(0, time + hold + release + 0.025);
      oscillator.connect(envelope).connect(panner);
      this.active.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        this.active.delete(oscillator);
        if (--remaining === 0) panner.disconnect();
      };
      oscillator.start(time);
      oscillator.stop(time + hold + release + 0.03);
    });
  }

  silence() {
    for (const oscillator of this.active) {
      try {
        oscillator.stop(this.context.currentTime);
      } catch {
        /* Already stopped. */
      }
    }
    this.active.clear();
    // Clear convolution tails when seeking or changing tonal center.
    const buffer = this.reverb.buffer;
    this.reverb.buffer = null;
    this.reverb.buffer = buffer;
  }

  dispose() {
    this.silence();
    this.vinyl.stop();
    this.vinyl.disconnect();
    this.tone.disconnect();
    this.ambience.stop();
    this.ambience.disconnect();
    this.ambienceFilter.disconnect();
    this.noiseVolume.disconnect();
    for (const layer of this.layers.values()) layer.disconnect();
    this.reverb.disconnect();
    this.wet.disconnect();
    this.compressor.disconnect();
    this.transitionGain.disconnect();
    this.master.disconnect();
    this.output.disconnect();
    this.analyser.disconnect();
  }
}
