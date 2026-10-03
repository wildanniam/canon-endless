import { renderLandscape } from "./landscape";
import type { Scene } from "../settings";
import type { MusicEvent } from "../events";
import { renderLiving } from "./living";
import type { LivingWorld } from "./world";

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
  private previous = document.createElement("canvas");
  private sceneChangedAt?: number;
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
  private world?: LivingWorld;
  private loading = false;
  private loadVersion = 0;
  private light = false;
  private unavailable = false;
  private disposed = false;
  onRendererChange?: (state: string) => void;

  get diagnostics() {
    return {
      renderer: this.canvas.dataset.renderer,
      ...this.world?.diagnostics,
    };
  }
  setLightweight(value: boolean) {
    if (!this.reduced.matches && !document.hidden && this.width > 0) {
      this.previous.width = this.canvas.width;
      this.previous.height = this.canvas.height;
      this.previous.getContext("2d")!.drawImage(this.canvas, 0, 0);
      this.sceneChangedAt = performance.now();
    }
    this.light = value;
    if (value) {
      this.loadVersion++;
      this.loading = false;
      this.world?.dispose();
      this.world = undefined;
    }
    this.ensureWorld();
    this.render(this.clock);
    this.motionChanged();
  }
  point(x: number, y: number) {
    this.world?.point(x, y);
  }
  touch(x: number, y: number) {
    if (!this.playing) return false;
    if (this.world)
      return this.world.touch(x, y, !this.reduced.matches);
    if (y < 0.53 && this.scene !== "forest" && this.scene !== "mountain")
      return false;
    if (!this.reduced.matches)
      this.particles.push({ x, y, born: this.clock, voice: 0, pitch: 72 });
    if (this.particles.length > 72) this.particles.shift();
    return true;
  }
  ripple() {
    if (!this.playing || this.reduced.matches) return;
    if (this.world) this.world.centerRipple();
    else this.touch(0.5, 0.65);
  }
  resetVoices() {
    this.particles = [];
    this.world?.resetVoices();
  }
  private rendererState(state: string) {
    this.canvas.dataset.renderer = state;
    this.onRendererChange?.(state);
  }
  private ensureWorld() {
    if (this.light || this.unavailable) {
      this.rendererState("2d");
      return;
    }
    if (this.world) {
      try {
        this.world.setScene(this.scene);
      } catch {
        this.fallback();
        return;
      }
      this.rendererState("webgl");
      return;
    }
    if (this.loading || this.disposed) return;
    this.loading = true;
    this.rendererState("loading");
    const version = ++this.loadVersion;
    void import("./world")
      .then(({ LivingWorld }) => {
        if (this.disposed || version !== this.loadVersion) return;
        this.world = new LivingWorld(() => this.fallback(), this.scene);
        this.world.resize(this.width, this.height);
        this.loading = false;
        if (!this.reduced.matches && !document.hidden) {
          this.previous.width = this.canvas.width;
          this.previous.height = this.canvas.height;
          this.previous.getContext("2d")!.drawImage(this.canvas, 0, 0);
          this.sceneChangedAt = performance.now();
        }
        this.rendererState("webgl");
        this.motionChanged();
      })
      .catch(() => {
        if (version === this.loadVersion && !this.disposed) this.fallback();
      });
  }
  private fallback() {
    this.unavailable = true;
    this.loading = false;
    this.world?.dispose();
    this.world = undefined;
    this.rendererState("2d");
    this.render(this.clock);
  }

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

  setScene(scene: Scene, animate = true) {
    if (scene === this.scene) {
      this.ensureWorld();
      return;
    }
    if (
      animate &&
      !this.reduced.matches &&
      !document.hidden &&
      this.width > 0
    ) {
      this.previous.width = this.canvas.width;
      this.previous.height = this.canvas.height;
      // Capture the current blend, so another click never jumps backwards.
      this.previous.getContext("2d")!.drawImage(this.canvas, 0, 0);
      this.sceneChangedAt = performance.now();
    } else this.finishSceneChange();
    this.scene = scene;
    this.ensureWorld();
    this.particles = [];
    this.paintBackground();
    this.render(this.clock);
    this.motionChanged();
  }
  setPlaying(playing: boolean) {
    this.playing = playing;
    this.started = performance.now() - this.clock;
    this.motionChanged();
  }
  event(event: MusicEvent) {
    if (!this.reduced.matches) this.world?.event(event);
    if (event.kind === "beat") this.pulse = Math.max(this.pulse, 0.7);
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
    this.finishSceneChange();
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
    this.world?.resize(this.width, this.height);
    this.paintBackground();
    this.render(this.clock);
  }
  private paintBackground() {
    renderLandscape(
      this.background.getContext("2d")!,
      this.width,
      this.height,
      this.scene,
      true,
    );
  }
  private motionChanged = () => {
    cancelAnimationFrame(this.frame);
    if (this.reduced.matches || document.hidden) this.finishSceneChange();
    if (
      (this.playing || this.sceneChangedAt !== undefined) &&
      !this.reduced.matches &&
      !document.hidden
    )
      this.frame = requestAnimationFrame(this.animate);
    else this.render(this.clock);
  };
  private finishSceneChange() {
    this.sceneChangedAt = undefined;
    this.previous.width = 0;
    this.previous.height = 0;
  }
  private visibilityChanged = () => {
    this.started = performance.now() - this.clock;
    this.motionChanged();
  };
  private animate = (time: number) => {
    if (time - this.lastFrame >= 1000 / 30) {
      if (this.playing) this.clock = time - this.started;
      this.lastFrame = time;
      this.render(this.clock);
    }
    if (this.playing || this.sceneChangedAt !== undefined)
      this.frame = requestAnimationFrame(this.animate);
  };

  private render(time: number) {
    const ctx = this.context,
      w = this.width,
      h = this.height;
    if (!w || !h) return;
    let rendered3d = false;
    if (this.world && !this.light) {
      try {
        ctx.drawImage(
          this.world.render(
            this.reduced.matches ? 0 : time / 1000,
            this.reduced.matches,
          ),
          0,
          0,
          w,
          h,
        );
        rendered3d = true;
      } catch {
        this.fallback();
      }
    }
    if (!rendered3d) {
      ctx.drawImage(this.background, 0, 0, w, h);
      renderLiving(
        ctx,
        w,
        h,
        this.scene,
        this.reduced.matches ? 0 : time / 1000,
        this.reduced.matches ? 0 : this.pulse,
      );
    }
    if (this.reduced.matches) return;
    if (!rendered3d && this.playing) {
      // Very subtle tonal wash and bass swell; no flashing or abrupt light changes.
      ctx.fillStyle = `hsla(${75 + this.chord * 7}, 40%, 70%, ${0.012 + this.pulse * 0.008})`;
      ctx.fillRect(0, 0, w, h);
      this.pulse *= 0.96;
    }
    this.particles = this.particles.filter((p) => time - p.born < 5000);
    for (const particle of rendered3d ? [] : this.particles) {
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
    if (this.sceneChangedAt !== undefined) {
      const progress = Math.min(
        1,
        (performance.now() - this.sceneChangedAt) / 1400,
      );
      if (progress >= 1) this.finishSceneChange();
      else {
        ctx.globalAlpha = 1 - progress * progress * (3 - 2 * progress);
        ctx.drawImage(this.previous, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.loadVersion++;
    this.world?.dispose();
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.reduced.removeEventListener("change", this.motionChanged);
    document.removeEventListener("visibilitychange", this.visibilityChanged);
  }
}
