import { renderLandscape } from "./landscape";
import type { Scene } from "../settings";
import type { MusicEvent } from "../events";
import { random } from "../music/random";

interface Particle {
  x: number;
  y: number;
  born: number;
  voice: number;
  pitch: number;
}
export class Landscape {
  private context: CanvasRenderingContext2D;
  private background = document.createElement("canvas");
  private frame = 0;
  private width = 0;
  private height = 0;
  private particles: Particle[] = [];
  private playing = false;
  private scene: Scene = "lake";
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  private observer: ResizeObserver;
  private started = performance.now();
  private lastFrame = 0;
  private clock = 0;
  private chord = 0;
  private pulse = 0;
  private specks = Array.from({ length: 42 }, (_, i) => {
    const rng = random(`speck-${i}`);
    return {
      x: rng(),
      y: rng(),
      speed: 0.3 + rng(),
      phase: rng() * Math.PI * 2,
    };
  });

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    this.context = context;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.reduced.addEventListener("change", this.motionChanged);
    document.addEventListener("visibilitychange", this.visibilityChanged);
    this.resize();
  }

  setScene(scene: Scene) {
    this.scene = scene;
    this.particles = [];
    this.paintBackground();
    this.render(this.clock);
  }
  setPlaying(playing: boolean) {
    this.playing = playing;
    this.started = performance.now() - this.clock;
    this.motionChanged();
  }
  event(event: MusicEvent) {
    if (event.kind === "chord") {
      this.chord = event.chord || 0;
      this.pulse = 1;
    }
    if (event.kind !== "note" || this.reduced.matches) return;
    this.particles.push({
      x: 0.2 + ((event.midi! * 13 + event.time * 7) % 65) / 100,
      y: 0.63 + (event.midi! % 12) / 65,
      born: this.clock,
      voice: event.voice || 0,
      pitch: event.midi!,
    });
    if (this.particles.length > 72) this.particles.shift();
  }

  private resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.width = bounds.width;
    this.height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    this.background.getContext("2d")!.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.paintBackground();
    this.render(this.clock);
  }
  private paintBackground() {
    renderLandscape(
      this.background.getContext("2d")!,
      this.width,
      this.height,
      this.scene,
    );
  }
  private motionChanged = () => {
    cancelAnimationFrame(this.frame);
    if (this.playing && !this.reduced.matches && !document.hidden)
      this.frame = requestAnimationFrame(this.animate);
    else this.render(this.clock);
  };
  private visibilityChanged = () => {
    this.started = performance.now() - this.clock;
    this.motionChanged();
  };
  private animate = (time: number) => {
    if (time - this.lastFrame >= 1000 / 30) {
      this.clock = time - this.started;
      this.lastFrame = time;
      this.render(this.clock);
    }
    this.frame = requestAnimationFrame(this.animate);
  };

  private render(time: number) {
    const ctx = this.context,
      w = this.width,
      h = this.height;
    if (!w || !h) return;
    ctx.drawImage(this.background, 0, 0, w, h);
    if (this.reduced.matches) return;
    if (this.playing) {
      // Very subtle tonal wash and bass swell; no flashing or abrupt light changes.
      ctx.fillStyle = `hsla(${75 + this.chord * 7}, 40%, 70%, ${0.012 + this.pulse * 0.008})`;
      ctx.fillRect(0, 0, w, h);
      this.pulse *= 0.96;
    }
    const seconds = time / 1000;
    for (const speck of this.specks) {
      const x = speck.x * w + Math.sin(seconds * 0.09 + speck.phase) * 25;
      const y = ((speck.y + seconds * 0.007 * speck.speed) % 1) * h;
      ctx.globalAlpha = this.scene === "rain" ? 0.22 : 0.38;
      ctx.fillStyle = this.scene === "blossom" ? "#f7ded8" : "#ffffe3";
      if (this.scene === "rain") {
        ctx.strokeStyle = "#eef4eb";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 15);
        ctx.stroke();
      } else if (this.scene === "blossom") {
        ctx.beginPath();
        ctx.ellipse(x, y, 3, 1.6, seconds * 0.25 + speck.phase, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(
          x,
          y * 0.85,
          this.scene === "aurora" ? 1.1 : 1.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    this.particles = this.particles.filter((p) => time - p.born < 5000);
    for (const particle of this.particles) {
      const life = (time - particle.born) / 5000;
      const x = particle.x * w,
        y = particle.y * h;
      ctx.globalAlpha = (1 - life) * 0.46;
      ctx.strokeStyle = ["#fcfae2", "#658b78", "#bfa582"][particle.voice];
      ctx.fillStyle = ctx.strokeStyle;
      if (["lake", "blossom", "aurora"].includes(this.scene)) {
        ctx.lineWidth = 0.8;
        for (let ring = 0; ring < 2; ring++) {
          ctx.beginPath();
          ctx.ellipse(
            x,
            y,
            5 + life * 90 + ring * 9,
            1.5 + life * 15 + ring * 2,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(
          x + Math.sin(life * 4) * 20,
          y - life * 80 - (particle.pitch - 60) * 3,
          1.8 + life,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.reduced.removeEventListener("change", this.motionChanged);
    document.removeEventListener("visibilitychange", this.visibilityChanged);
  }
}
