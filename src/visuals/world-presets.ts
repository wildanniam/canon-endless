import type { Scene } from "../settings";

export const WORLDS: Record<
  Scene,
  {
    sky: number;
    fog: string;
    fogNear: number;
    fogFar: number;
    light: string;
    ground: string;
    sun: string;
    water: boolean;
    waterTint: string;
    reflection: number;
    trails: [string, string, string];
    ambient: string;
    ambientOpacity: number;
  }
> = {
  aurora: {
    sky: -1,
    fog: "#183b42",
    fogNear: 55,
    fogFar: 180,
    light: "#92c5c0",
    ground: "#081b21",
    sun: "#b8d8ce",
    water: true,
    waterTint: "#163439",
    reflection: 0.72,
    trails: ["#f3d6a1", "#8fe5bb", "#d5e8f3"],
    ambient: "#d8cf86",
    ambientOpacity: 1,
  },
  lake: {
    sky: 0,
    fog: "#d6dcc4",
    fogNear: 48,
    fogFar: 155,
    light: "#f8e9c3",
    ground: "#6d896d",
    sun: "#ffebc2",
    water: true,
    waterTint: "#779d90",
    reflection: 0.68,
    trails: ["#b57632", "#477963", "#66829b"],
    ambient: "#e5ce8a",
    ambientOpacity: 0.3,
  },
  forest: {
    sky: 1,
    fog: "#567863",
    fogNear: 30,
    fogFar: 110,
    light: "#d1dfb1",
    ground: "#1d382d",
    sun: "#ffdda1",
    water: false,
    waterTint: "#355945",
    reflection: 0.5,
    trails: ["#e4be71", "#b5ebaf", "#d6e8c5"],
    ambient: "#f3db8b",
    ambientOpacity: 1.1,
  },
  mountain: {
    sky: 2,
    fog: "#bf9f95",
    fogNear: 80,
    fogFar: 220,
    light: "#f1c0a0",
    ground: "#524052",
    sun: "#ffbd76",
    water: false,
    waterTint: "#5f565b",
    reflection: 0.5,
    trails: ["#ffdc8f", "#f0ac8e", "#eee0d7"],
    ambient: "#ffcd95",
    ambientOpacity: 0.55,
  },
  blossom: {
    sky: 3,
    fog: "#e5ced3",
    fogNear: 50,
    fogFar: 150,
    light: "#f7e5de",
    ground: "#725169",
    sun: "#ffe0bd",
    water: true,
    waterTint: "#a6a8ae",
    reflection: 0.6,
    trails: ["#bd5274", "#8c649e", "#6e8c78"],
    ambient: "#ffc6d7",
    ambientOpacity: 0.35,
  },
  rain: {
    sky: 4,
    fog: "#a8bec0",
    fogNear: 38,
    fogFar: 140,
    light: "#d9e8de",
    ground: "#426556",
    sun: "#ffe5b1",
    water: true,
    waterTint: "#759694",
    reflection: 0.58,
    trails: ["#f2d9a0", "#abdbc6", "#d3e9ec"],
    ambient: "#c2ded6",
    ambientOpacity: 0.25,
  },
};
