import { PALETTES, pine } from "./landscape";
import { random } from "../music/random";
import type { Scene } from "../settings";

// Fixed geometry/noise; animation changes positions, never accumulates objects.
const rng = random("living-landscape-v1");
const flecks = Array.from({ length: 140 }, () => ({
  x: rng(),
  y: rng(),
  size: rng(),
  phase: rng() * Math.PI * 2,
}));
const TAU = Math.PI * 2;

/** Environmental movement over cached scenery, in CSS pixels. No DOM work. */
export function renderLiving(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: Scene,
  seconds: number,
  pulse: number,
) {
  const palette = PALETTES[scene];
  ctx.save();
  const wind = Math.sin(seconds * 0.42) * 0.6 + Math.sin(seconds * 0.17) * 0.4;

  if (scene === "aurora") {
    // Broad translucent curtains rather than many individual glowing particles.
    for (let band = 0; band < 3; band++) {
      const glow = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.47);
      glow.addColorStop(0, "#88d8b000");
      glow.addColorStop(0.45, band === 1 ? "#86bfb738" : "#91dba94a");
      glow.addColorStop(1, "#70b59500");
      ctx.fillStyle = glow;
      ctx.beginPath();
      for (let x = 0; x <= w + 20; x += 20) {
        const y =
          h *
          (0.17 +
            band * 0.035 +
            Math.sin((x / w) * 5 + seconds * 0.16 + band) * 0.065 +
            Math.sin((x / w) * 11 - seconds * 0.1) * 0.025);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let x = w + 20; x >= 0; x -= 20) {
        const y =
          h *
          (0.36 +
            band * 0.025 +
            Math.sin((x / w) * 5 + seconds * 0.16 + band + 0.4) * 0.075);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    for (const f of flecks.slice(0, 85)) {
      ctx.globalAlpha =
        0.3 + (0.5 + 0.5 * Math.sin(seconds * 0.7 + f.phase)) * 0.5;
      ctx.fillStyle = "#f1f4d9";
      ctx.beginPath();
      ctx.arc(f.x * w, f.y * h * 0.46, 0.55 + f.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // Haze drifts across the far horizon, with a long transparent leading edge.
    for (let i = 0; i < 4; i++) {
      const x = (((i * 0.31 + seconds * 0.009) % 1.6) - 0.3) * w;
      const y =
        h * (0.35 + i * 0.055) + Math.sin(seconds * 0.2 + i) * h * 0.008;
      const fog = ctx.createRadialGradient(x, y, 0, x, y, w * 0.23);
      fog.addColorStop(0, scene === "rain" ? "#eaf1e11b" : "#fff8e226");
      fog.addColorStop(1, "#fff8e200");
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.16);
      ctx.translate(-x, -y);
      ctx.fillStyle = fog;
      ctx.fillRect(x - w * 0.25, y - w * 0.25, w * 0.5, w * 0.5);
      ctx.restore();
    }
    if (scene !== "rain") {
      ctx.strokeStyle = palette[5];
      ctx.lineWidth = 1.15;
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 5; i++) {
        const x = w * (0.56 + ((seconds * 0.013 + i * 0.046) % 0.6));
        const y =
          h * (0.3 + Math.sin(seconds * 0.28 + i * 0.7) * 0.015 + i * 0.008);
        const size = 3.5 + i * 0.3,
          flap = Math.sin(seconds * 3.4 + i) * 2.3;
        ctx.beginPath();
        ctx.moveTo(x - size, y + flap);
        ctx.quadraticCurveTo(x - size * 0.45, y - 2, x, y);
        ctx.quadraticCurveTo(x + size * 0.5, y - 2, x + size, y + flap);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  if (["lake", "blossom", "aurora"].includes(scene)) {
    // Moving reflection strokes get longer toward the foreground.
    ctx.lineCap = "round";
    for (const f of flecks.slice(0, 75)) {
      const y = h * (0.617 + f.y * 0.38),
        x = f.x * w + Math.sin(seconds * 0.45 + f.phase) * 18;
      const span = (8 + f.y * 65 + f.size * 16) * (w / 1440 + 0.35);
      ctx.globalAlpha =
        (0.08 + f.size * 0.13) *
        (0.7 + Math.sin(seconds * 0.7 + f.phase) * 0.3);
      ctx.strokeStyle = f.size > 0.42 ? "#fff9de" : palette[5];
      ctx.lineWidth = 0.6 + f.y;
      ctx.beginPath();
      ctx.moveTo(x - span / 2, y);
      ctx.quadraticCurveTo(
        x,
        y + Math.sin(seconds * 0.8 + f.phase) * 1.6,
        x + span / 2,
        y,
      );
      ctx.stroke();
    }
    // Slow expanding rings remain visible around the player edges.
    for (let i = 0; i < 8; i++) {
      const life = (seconds * 0.13 + i * 0.123) % 1;
      ctx.globalAlpha = Math.sin(life * Math.PI) * 0.2;
      ctx.strokeStyle = scene === "aurora" ? "#aad2b6" : "#faffdc";
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.ellipse(
        w * (i % 2 === 0 ? 0.08 : 0.92),
        h * (0.67 + (i % 4) * 0.09),
        10 + life * 65,
        2 + life * 11,
        0,
        0,
        TAU,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (scene === "forest") {
    for (let i = 0; i < 4; i++) {
      const x = w * (0.62 + i * 0.1) + wind * 14;
      const light = ctx.createLinearGradient(x, 0, x - w * 0.25, h * 0.9);
      light.addColorStop(0, "#fff9d800");
      light.addColorStop(0.45, "#fff9d817");
      light.addColorStop(1, "#fff9d800");
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.lineTo(x + w * 0.04, -20);
      ctx.lineTo(x - w * 0.22, h * 0.9);
      ctx.lineTo(x - w * 0.4, h * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    const treeRng = random("foreground-forest");
    [0.02, 0.09, 0.94, 1.01].forEach((x, i) => {
      ctx.save();
      const bend = Math.sin(seconds * 0.6 + i) * 0.009;
      ctx.transform(1, 0, bend, 1, -bend * h * 0.96, 0);
      pine(
        ctx,
        x * w,
        h * 0.96,
        h * (i < 2 ? 0.34 + i * 0.06 : 0.72 + i * 0.035),
        palette[5],
        treeRng,
      );
      ctx.restore();
    });
    for (const f of flecks.slice(0, 22)) {
      const x = f.x * w + Math.sin(seconds * 0.65 + f.phase) * 24,
        y = h * (0.42 + f.y * 0.48) + Math.cos(seconds * 0.4 + f.phase) * 18;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 9 + f.size * 5);
      const alpha =
        (0.25 + (0.5 + 0.5 * Math.sin(seconds * 0.8 + f.phase)) * 0.45) *
        (1 + pulse * 0.08);
      glow.addColorStop(0, `rgba(239,241,166,${alpha})`);
      glow.addColorStop(1, "#e9f1aa00");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 15, y - 15, 30, 30);
    }
  }

  if (scene === "blossom") {
    ctx.save();
    ctx.translate(w, h * 0.65);
    ctx.rotate(Math.sin(seconds * 0.45) * 0.009);
    ctx.translate(-w, -h * 0.65);
    ctx.strokeStyle = "#5d6f55";
    ctx.lineWidth = Math.max(3, w * 0.005);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 1.02, h * 0.65);
    ctx.bezierCurveTo(w * 0.9, h * 0.4, w * 0.91, h * 0.26, w * 0.69, h * 0.22);
    ctx.stroke();
    for (const f of flecks.slice(0, 90)) {
      ctx.fillStyle = ["#e8b7b1", "#f4d2ca", "#fcf0e5"][Math.floor(f.size * 3)];
      ctx.beginPath();
      ctx.ellipse(
        w * (0.71 + f.x * 0.32),
        h * (0.16 + f.y * 0.3),
        h * (0.003 + f.size * 0.005),
        h * 0.004,
        f.phase,
        0,
        TAU,
      );
      ctx.fill();
    }
    ctx.restore();
    for (const f of flecks.slice(0, 44)) {
      const x =
        (((f.x + seconds * (0.012 + f.size * 0.008)) % 1.2) - 0.1) * w +
        Math.sin(seconds * 0.8 + f.phase) * 28;
      const y = (((f.y + seconds * (0.022 + f.size * 0.01)) % 1.15) - 0.1) * h;
      ctx.globalAlpha = 0.45 + f.size * 0.35;
      ctx.fillStyle = f.size > 0.5 ? "#edbdb7" : "#fff0e6";
      ctx.beginPath();
      ctx.ellipse(x, y, 2.5 + f.size * 3, 1.5, seconds * 0.8 + f.phase, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (scene === "rain") {
    ctx.strokeStyle = "#eef5e9";
    ctx.lineWidth = 0.7;
    for (const f of flecks) {
      const depth = 0.5 + f.size,
        x = ((f.x - seconds * 0.015 * depth + 100) % 1.1) * w,
        y = (((f.y + seconds * 0.24 * depth) % 1.15) - 0.1) * h;
      ctx.globalAlpha = 0.16 + f.size * 0.24;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4 - depth * 3, y + 12 + depth * 13);
      ctx.stroke();
    }
    for (const f of flecks.slice(0, 16)) {
      const life = (seconds * 0.65 + f.phase) % 1;
      ctx.globalAlpha = (1 - life) * 0.2;
      ctx.beginPath();
      ctx.ellipse(
        f.x * w,
        h * (0.62 + f.y * 0.36),
        2 + life * 13,
        1 + life * 3,
        0,
        0,
        TAU,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Sway from the base of the grass, never translating the whole landscape/UI.
  ctx.strokeStyle = palette[5];
  ctx.lineWidth = 0.85;
  for (let i = 0; i < 70; i++) {
    const f = flecks[i],
      x = (i < 35 ? f.x * 0.14 : 0.87 + f.x * 0.13) * w,
      y = h * (0.94 + f.y * 0.1),
      length = h * (0.055 + f.size * 0.13);
    const sway =
      Math.sin(seconds * 0.9 + f.phase) * length * 0.12 + wind * length * 0.08;
    ctx.globalAlpha = 0.22 + f.size * 0.35;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x - length * 0.2 + sway * 0.35,
      y - length * 0.6,
      x + (f.x - 0.5) * length + sway,
      y - length,
    );
    ctx.stroke();
  }
  ctx.restore();
}
