import { random } from "../music/random";
import type { Scene } from "../settings";

export const SCENE_INFO: Record<
  Scene,
  { name: string; place: string; description: string }
> = {
  lake: {
    name: "Stillwater",
    place: "A lake at first light",
    description: "Soft ripples, distant mountains, nowhere to be.",
  },
  forest: {
    name: "Forest light",
    place: "Beneath the quiet canopy",
    description: "Tall trees and little things drifting in the light.",
  },
  mountain: {
    name: "Last light",
    place: "Where the mountains meet the sky",
    description: "Warm horizons, long shadows, a slower evening.",
  },
  blossom: {
    name: "In bloom",
    place: "A garden between seasons",
    description: "A few petals carried by a passing melody.",
  },
  aurora: {
    name: "Northern night",
    place: "Under an open sky",
    description: "A quiet constellation and curtains of green.",
  },
  rain: {
    name: "After the rain",
    place: "A meadow taking a breath",
    description: "Silver rain, soft grass, a little room to listen.",
  },
};

type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export const PALETTES: Record<Scene, string[]> = {
  lake: [
    "#f4f1e6",
    "#e2e5cd",
    "#c0cbbb",
    "#a0b5a6",
    "#779a8d",
    "#527b70",
    "#d1dbca",
    "#b2c8b8",
  ],
  forest: [
    "#efeedc",
    "#dadfc4",
    "#b4c2a2",
    "#8ea181",
    "#627f65",
    "#395d4a",
    "#b6c3a0",
    "#819b77",
  ],
  mountain: [
    "#f6e9d9",
    "#eacbb4",
    "#d8b29c",
    "#ba9688",
    "#927d76",
    "#635e59",
    "#ceb099",
    "#a88978",
  ],
  blossom: [
    "#f8eeea",
    "#ece0d7",
    "#cbd0be",
    "#afbca9",
    "#94a68a",
    "#6e876d",
    "#e4dcd0",
    "#baceb5",
  ],
  aurora: [
    "#112b2c",
    "#21463e",
    "#355750",
    "#2a4b46",
    "#1b3934",
    "#102c28",
    "#23463f",
    "#15372f",
  ],
  rain: [
    "#e4e9e3",
    "#cdd9cd",
    "#b2c2b6",
    "#92aa9b",
    "#769281",
    "#527762",
    "#a1b7a1",
    "#7e9e80",
  ],
};

function ridge(
  ctx: Context,
  w: number,
  h: number,
  baseline: number,
  height: number,
  color: string,
  seed: string,
) {
  const rng = random(seed);
  const phases = Array.from({ length: 4 }, () => rng() * Math.PI * 2);
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = -5; x <= w + 5; x += 5) {
    const n = x / w;
    const wave =
      Math.sin(n * 8 + phases[0]) * 0.37 +
      Math.sin(n * 17 + phases[1]) * 0.19 +
      Math.sin(n * 32 + phases[2]) * 0.06 +
      Math.sin(n * 65 + phases[3]) * 0.025;
    ctx.lineTo(x, h * (baseline + wave * height));
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function pine(
  ctx: Context,
  x: number,
  y: number,
  size: number,
  color: string,
  rng: () => number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x - size * 0.012, y - size, size * 0.024, size);
  for (let i = 0; i < 9; i++) {
    const top = y - size + i * size * 0.085;
    const width = size * (0.045 + i * 0.025);
    ctx.beginPath();
    ctx.moveTo(x, top - size * 0.08);
    ctx.lineTo(x + width * (0.8 + rng() * 0.2), top + size * 0.17);
    ctx.lineTo(x + width * 0.28, top + size * 0.145);
    ctx.lineTo(x, top + size * 0.19);
    ctx.lineTo(x - width, top + size * 0.17);
    ctx.closePath();
    ctx.fill();
  }
}

export function renderLandscape(
  ctx: Context,
  w: number,
  h: number,
  scene: Scene,
  living = false,
) {
  const p = PALETTES[scene];
  const rng = random(`landscape-${scene}`);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p[0]);
  sky.addColorStop(0.5, p[1]);
  sky.addColorStop(1, p[6]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sunX = w * 0.77,
    sunY = h * 0.235;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.21);
  sun.addColorStop(0, scene === "aurora" ? "#aed8b92a" : "#fff9e975");
  sun.addColorStop(1, "#ffffff00");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = scene === "aurora" ? "#e5eed3" : "#fff9e6";
  ctx.beginPath();
  ctx.arc(
    sunX,
    sunY,
    h * (scene === "mountain" ? 0.049 : 0.025),
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (scene === "aurora" && !living) {
    for (let i = 0; i < 160; i++) {
      ctx.globalAlpha = 0.2 + rng() * 0.6;
      ctx.fillStyle = "#eef5d8";
      ctx.beginPath();
      ctx.arc(rng() * w, rng() * h * 0.54, 0.4 + rng() * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 70; i++) {
      const x = w * (0.25 + i / 95);
      const y = h * (0.15 + Math.sin(i * 0.065) * 0.095);
      const glow = ctx.createLinearGradient(x, y, x, y + h * 0.25);
      glow.addColorStop(0, "#70b48a00");
      glow.addColorStop(0.8, "#83ca9f17");
      glow.addColorStop(1, "#a5d4ac00");
      ctx.strokeStyle = glow;
      ctx.lineWidth = w / 85;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x - w * 0.1,
        y + h * 0.06,
        x - w * 0.07,
        y + h * 0.18,
        x,
        y + h * 0.25,
      );
      ctx.stroke();
    }
  }

  // Distant ridges keep the left-hand title area open and airy.
  ridge(ctx, w, h, 0.48, 0.19, p[2], "ridge1");
  ridge(ctx, w, h, 0.53, 0.17, p[3], "ridge2");
  ridge(ctx, w, h, 0.6, 0.17, p[4], "ridge3");

  const waterScene = ["lake", "blossom", "aurora"].includes(scene);
  if (waterScene) {
    const water = ctx.createLinearGradient(0, h * 0.59, 0, h);
    water.addColorStop(0, p[6]);
    water.addColorStop(1, p[7]);
    ctx.fillStyle = water;
    ctx.fillRect(0, h * 0.605, w, h * 0.4);
    // Reflections break into thin irregular brush strokes.
    for (let i = 0; i < 320; i++) {
      const y = h * (0.61 + rng() * 0.39);
      const x = rng() * w;
      const width = ((8 + rng() * 80) * w) / 1440;
      ctx.globalAlpha = 0.045 + rng() * 0.1;
      ctx.fillStyle = rng() > 0.45 ? p[5] : "#ffffe8";
      ctx.fillRect(x, y, width, 0.5 + rng() * 1.5);
    }
    ctx.globalAlpha = 1;
    // A small wooded island anchors the right horizon.
    ctx.fillStyle = p[5];
    ctx.beginPath();
    ctx.ellipse(w * 0.81, h * 0.615, w * 0.12, h * 0.008, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 32; i++) {
      const x = w * (0.715 + rng() * 0.2);
      pine(ctx, x, h * 0.61, h * (0.025 + rng() * 0.057), p[5], rng);
    }
  } else {
    ridge(ctx, w, h, 0.76, 0.25, p[5], "near-hill");
    ridge(ctx, w, h, 0.9, 0.15, p[7], "nearer-hill");
  }

  if (scene === "forest") {
    for (let i = 0; i < 25; i++) {
      const x = rng() * w;
      pine(
        ctx,
        x,
        h * (0.78 + rng() * 0.1),
        h * (0.1 + rng() * 0.22),
        p[4],
        rng,
      );
    }
    if (!living)
      [0.02, 0.09, 0.94, 1.01].forEach((x, i) =>
        pine(
          ctx,
          x * w,
          h * 0.96,
          h * (i < 2 ? 0.34 + i * 0.06 : 0.72 + i * 0.035),
          p[5],
          rng,
        ),
      );
    ctx.fillStyle = "#fff8c610";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(w * (0.7 + i * 0.04), 0);
      ctx.lineTo(w * (0.2 + i * 0.16), h);
      ctx.lineTo(w * (0.1 + i * 0.16), h);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (scene === "blossom" && !living) {
    ctx.strokeStyle = "#5d6f55";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(3, w * 0.005);
    ctx.beginPath();
    ctx.moveTo(w * 1.02, h * 0.65);
    ctx.bezierCurveTo(w * 0.9, h * 0.4, w * 0.91, h * 0.26, w * 0.69, h * 0.22);
    ctx.stroke();
    for (let i = 0; i < 90; i++) {
      const x = w * (0.71 + rng() * 0.32),
        y = h * (0.16 + rng() * 0.3);
      ctx.fillStyle = pickBlossom(rng());
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        h * (0.003 + rng() * 0.005),
        h * 0.004,
        rng() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  if (living) return;
  // Foreground reeds and grasses, deliberately confined to the edges.
  ctx.strokeStyle = p[5];
  ctx.lineWidth = 1;
  for (let i = 0; i < 110; i++) {
    const x = (i < 55 ? rng() * 0.14 : 0.87 + rng() * 0.13) * w;
    const y = h * (0.93 + rng() * 0.13),
      length = h * (0.05 + rng() * 0.13);
    ctx.globalAlpha = 0.2 + rng() * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x - length * 0.2,
      y - length * 0.6,
      x + length * (rng() - 0.5),
      y - length,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (scene !== "aurora") {
    ctx.strokeStyle = p[5];
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 5; i++) {
      const x = w * (0.64 + rng() * 0.1),
        y = h * (0.31 + rng() * 0.035),
        s = 2 + rng() * 3;
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.quadraticCurveTo(x - s / 2, y - s / 2, x, y);
      ctx.quadraticCurveTo(x + s / 2, y - s / 2, x + s, y - 1);
      ctx.stroke();
    }
  }
}

function pickBlossom(n: number) {
  return ["#e8b7b1", "#f4d2ca", "#fcf0e5", "#d5a7a4"][Math.floor(n * 4)];
}

export function thumbnail(scene: Scene): string {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 230;
  renderLandscape(canvas.getContext("2d")!, 400, 230, scene);
  return canvas.toDataURL();
}
