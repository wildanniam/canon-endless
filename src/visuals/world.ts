import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { random } from "../music/random";
import type { MusicEvent } from "../events";
import type { Scene } from "../settings";
import { WORLDS } from "./world-presets";
import { buildSurroundings } from "./world-scenes";
import {
  skyVertex,
  skyFragment,
  waterVertex,
  waterFragment,
  glowVertex,
  glowFragment,
} from "./world-shaders";

const TRAIL_LENGTH = 48;
interface Trail {
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  head: THREE.Vector3;
  target: THREE.Vector3;
  lastNote: number;
}

/** Optional renderer. The Landscape owns time, transitions and the only RAF loop. */
export class LivingWorld {
  readonly canvas = document.createElement("canvas");
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
  private water!: Reflector;
  private sky!: THREE.ShaderMaterial;
  private trails: Trail[] = [];
  private fireflies!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private flyOrigins!: Float32Array;
  private ripples = Array.from(
    { length: 8 },
    () => new THREE.Vector4(0, 0, -100, 0),
  );
  private rippleIndex = 0;
  private ray = new THREE.Raycaster();
  private waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hit = new THREE.Vector3();
  private pointer = new THREE.Vector2();
  private pointerCurrent = new THREE.Vector2();
  private time = 0;
  private lastTime = 0;
  private energy = 0;
  private width = 1;
  private height = 1;
  private quality = 1;
  private samples = 0;
  private cost = 0;
  private failed = false;
  private resizePending = false;

  private surroundings?: THREE.Group;
  private animateSurroundings?: (
    time: number,
    energy: number,
    gesture: number,
  ) => void;
  private gestureEnergy = 0;
  private bursts!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private burstOrigins = Array.from(
    { length: 8 },
    () => new THREE.Vector4(0, 0, 0, -100),
  );
  private burstIndex = 0;

  constructor(
    private onLost: () => void,
    private kind: Scene,
  ) {
    const context = this.canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!context) throw new Error("WebGL 2 unavailable");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context,
      antialias: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.debug.onShaderError = () => {
      this.failed = true;
    };
    this.canvas.addEventListener("webglcontextlost", this.contextLost);
    try {
      this.buildScene();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  setScene(kind: Scene) {
    if (kind === this.kind) return;
    this.disposeScene();
    this.kind = kind;
    this.trails = [];
    this.animateSurroundings = undefined;
    this.surroundings = undefined;
    for (const ripple of this.ripples) ripple.set(0, 0, -100, 0);
    for (const origin of this.burstOrigins) origin.set(0, 0, 0, -100);
    this.energy = 0;
    this.gestureEnergy = 0;
    this.pointer.set(0, 0);
    this.pointerCurrent.set(0, 0);
    this.buildScene();
    this.resize(this.width, this.height);
  }
  private buildScene() {
    const config = WORLDS[this.kind];
    this.scene.fog = new THREE.Fog(config.fog, config.fogNear, config.fogFar);
    this.scene.add(new THREE.HemisphereLight(config.light, config.ground, 2));
    const moonLight = new THREE.DirectionalLight(config.sun, 1.7);
    moonLight.position.set(25, 55, -30);
    this.scene.add(moonLight);
    this.sky = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uScene: { value: config.sky },
      },
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.scene.add(
      new THREE.Mesh(new THREE.SphereGeometry(230, 32, 16), this.sky),
    );
    this.water = new Reflector(new THREE.PlaneGeometry(450, 450), {
      textureWidth: 512,
      textureHeight: 512,
      multisample: 0,
      clipBias: 0.003,
      shader: {
        name: "WorldWater",
        uniforms: {
          color: { value: new THREE.Color() },
          tDiffuse: { value: null },
          textureMatrix: { value: new THREE.Matrix4() },
          uTime: { value: 0 },
          uRipples: { value: this.ripples },
          uTint: {
            value:
              this.kind === "aurora"
                ? new THREE.Vector3(0.008, 0.035, 0.043)
                : new THREE.Color(config.waterTint),
          },
          uReflection: { value: config.reflection },
          uRain: { value: this.kind === "rain" ? 1 : 0 },
        },
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
      },
    });
    // LDR reflections do not require floating-point color-buffer extensions.
    this.water.getRenderTarget().texture.type = THREE.UnsignedByteType;
    this.water.rotation.x = -Math.PI / 2;
    this.waterMaterial.uniforms.uRipples.value = this.ripples;
    this.water.visible = config.water;
    this.scene.add(this.water);
    if (this.kind === "aurora") this.terrain();
    else {
      this.surroundings = new THREE.Group();
      this.scene.add(this.surroundings);
      this.animateSurroundings = buildSurroundings(this.kind, this.surroundings);
    }
    for (let voice = 0; voice < 3; voice++) {
      const positions = new Float32Array(TRAIL_LENGTH * 3);
      const head = new THREE.Vector3(
        -8 + voice * 8,
        3 + voice,
        -13 - voice * 4,
      );
      for (let i = 0; i < TRAIL_LENGTH; i++) head.toArray(positions, i * 3);
      const points = this.glowPoints(
        positions,
        config.trails[voice],
        1.35,
        true,
      );
      points.material.uniforms.uOpacity.value = 0;
      this.trails.push({ points, head, target: head.clone(), lastNote: -100 });
      this.scene.add(points);
    }
    const rng = random("aurora-fireflies-v1");
    this.flyOrigins = Float32Array.from({ length: 90 * 3 }, (_, i) =>
      i % 3 === 0
        ? (rng() - 0.5) * 65
        : i % 3 === 1
          ? 1 + rng() * 7
          : -32 + rng() * 50,
    );
    this.fireflies = this.glowPoints(
      this.flyOrigins.slice(),
      config.ambient,
      0.46,
      false,
    );
    this.fireflies.material.uniforms.uOpacity.value = config.ambientOpacity;
    this.scene.add(this.fireflies);
    this.bursts = this.glowPoints(
      new Float32Array(8 * 12 * 3),
      config.trails[0],
      1.05,
      false,
    );
    this.bursts.geometry.getAttribute("aAlpha").array.fill(0);
    this.scene.add(this.bursts);
  }
  private get waterMaterial() {
    return this.water.material as THREE.ShaderMaterial;
  }
  private glowPoints(
    positions: Float32Array,
    color: string,
    size: number,
    trail: boolean,
  ) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute(
      "aAlpha",
      new THREE.Float32BufferAttribute(
        Array.from({ length: positions.length / 3 }, (_, i) =>
          trail ? (1 - i / TRAIL_LENGTH) ** 1.5 : 0.35 + (i % 7) / 12,
        ),
        1,
      ),
    );
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 1 },
        uSize: { value: size },
      },
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      transparent: true,
      depthWrite: false,
      blending: ["aurora", "forest", "mountain", "rain"].includes(this.kind)
        ? THREE.AdditiveBlending
        : THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
  }
  private terrain() {
    const rng = random("aurora-shores-v1");
    // Angular ridgelines: real depth and shaded facets, with a low open valley.
    for (let band = 0; band < 3; band++) {
      const positions: number[] = [],
        colors: number[] = [];
      const base = new THREE.Color(["#47777a", "#2e595d", "#204347"][band]);
      const z = -100 + band * 25;
      const tops = Array.from({ length: 33 }, (_, i) => {
        const x = (i - 16) * 9;
        return new THREE.Vector3(
          x,
          4 + Math.abs(x) * 0.13 + rng() * 12 + (band === 0 ? 8 : 0),
          z + (rng() - 0.5) * 9,
        );
      });
      for (let i = 0; i < 32; i++) {
        const a = tops[i],
          b = tops[i + 1];
        const lowA = new THREE.Vector3(a.x, -2, z + 7),
          lowB = new THREE.Vector3(b.x, -2, z + 7);
        for (const triangle of [
          [a, lowA, b],
          [b, lowA, lowB],
        ]) {
          const c = base.clone().multiplyScalar(0.65 + rng() * 0.45);
          for (const p of triangle) {
            positions.push(p.x, p.y, p.z);
            colors.push(c.r, c.g, c.b);
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      geometry.computeVertexNormals();
      this.scene.add(
        new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
          }),
        ),
      );
    }
    // Two irregular wooded shores frame the lake; instancing keeps draw calls low.
    const count = 100,
      dummy = new THREE.Object3D();
    const treeMaterial = new THREE.MeshLambertMaterial({
      color: "#163933",
      flatShading: true,
    });
    const foliage = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 5),
      treeMaterial,
      count * 3,
    );
    const trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.08, 0.16, 1, 5),
      new THREE.MeshLambertMaterial({ color: "#142d2b" }),
      count,
    );
    const rock = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshLambertMaterial({ color: "#274744", flatShading: true }),
      26,
    );
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -46 + rng() * 62;
      const x = side * (14 + (z + 46) * 0.15 + rng() * 11);
      const size = 2 + rng() * 5;
      dummy.position.set(x, size * 0.3, z);
      dummy.scale.set(1, size * 0.8, 1);
      dummy.rotation.set(0, rng() * 6, 0);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      for (let layer = 0; layer < 3; layer++) {
        dummy.position.set(x, size * (0.45 + layer * 0.25), z);
        dummy.scale.set(
          size * (0.36 - layer * 0.065),
          size * (0.7 - layer * 0.12),
          size * (0.36 - layer * 0.065),
        );
        dummy.updateMatrix();
        foliage.setMatrixAt(i * 3 + layer, dummy.matrix);
      }
    }
    for (let i = 0; i < 26; i++) {
      const z = -43 + rng() * 62;
      dummy.position.set((i % 2 ? 1 : -1) * (17 + (z + 43) * 0.14), -0.35, z);
      dummy.scale.set(7 + rng() * 4, 0.6 + rng() * 0.8, 4 + rng() * 5);
      dummy.rotation.set(0, rng() * 6, 0.03);
      dummy.updateMatrix();
      rock.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(foliage, trunks, rock);
  }
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    const pixelBudget = width < 700 ? 650_000 : 1_450_000;
    const ratio =
      Math.min(
        devicePixelRatio || 1,
        1.4,
        Math.sqrt(pixelBudget / (width * height)),
      ) * this.quality;
    this.renderer.setPixelRatio(Math.max(0.55, ratio));
    this.renderer.setSize(width, height, false);
    // Keep the shores in view in portrait compositions without widening the UI.
    if (this.surroundings && WORLDS[this.kind].water)
      this.surroundings.scale.x = Math.max(0.5, Math.min(1, width / height));
    this.camera.aspect = width / height;
    this.camera.fov = width < 700 ? 60 : 48;
    this.camera.updateProjectionMatrix();
    const reflectionSize = width < 700 || this.quality < 1 ? 256 : 512;
    this.water.getRenderTarget().setSize(reflectionSize, reflectionSize);
  }
  event(event: MusicEvent) {
    if (event.kind === "beat" || event.kind === "chord")
      this.energy = Math.max(this.energy, event.kind === "chord" ? 0.8 : 0.5);
    if (event.kind !== "note" || event.midi === undefined) return;
    const voice = event.voice || 0,
      trail = this.trails[voice];
    if (!trail) return;
    const pitch = (event.midi - 60) / 24;
    trail.target.set(
      Math.sin(pitch * 4.5 + voice * 0.8) * 12,
      1.8 + pitch * 4 + voice * 0.45,
      -12 - voice * 5 - Math.cos(pitch * 5) * 4,
    );
    trail.lastNote = this.time;
  }
  point(x: number, y: number) {
    this.pointer.set((x - 0.5) * 2, (y - 0.5) * 2);
  }
  touch(x: number, y: number, animate = true) {
    this.ray.setFromCamera(
      new THREE.Vector2(x * 2 - 1, 1 - y * 2),
      this.camera,
    );
    const water = WORLDS[this.kind].water;
    this.waterPlane.set(
      water ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1),
      water ? 0 : 20,
    );
    if (!this.ray.ray.intersectPlane(this.waterPlane, this.hit)) return false;
    if (
      water &&
      (this.hit.z < -60 ||
        this.hit.z > 22 ||
        Math.abs(this.hit.x) > 18 + (this.hit.z + 45) * 0.15)
    )
      return false;
    if (!animate) return true;
    this.gestureEnergy = 1;
    this.burstOrigins[this.burstIndex++ % 8].set(
      this.hit.x,
      Math.max(0.2, this.hit.y),
      this.hit.z,
      this.time,
    );
    this.ripples[this.rippleIndex++ % 8].set(
      this.hit.x,
      this.hit.z,
      this.time,
      1,
    );
    return true;
  }
  centerRipple() {
    this.ripples[this.rippleIndex++ % 8].set(0, -7, this.time, 1);
    this.gestureEnergy = 1;
    this.burstOrigins[this.burstIndex++ % 8].set(
      0,
      WORLDS[this.kind].water ? 0.2 : 5,
      -14,
      this.time,
    );
  }
  resetVoices() {
    for (const trail of this.trails) {
      trail.lastNote = -100;
      trail.points.material.uniforms.uOpacity.value = 0;
    }
  }
  render(seconds: number, reduced: boolean) {
    if (this.failed) throw new Error("Scene shader unavailable");
    if (this.resizePending) {
      this.resizePending = false;
      this.resize(this.width, this.height);
    }
    const start = performance.now();
    const dt = Math.min(0.1, Math.max(0, seconds - this.lastTime));
    this.lastTime = seconds;
    this.time = seconds;
    const t = reduced ? 0 : seconds;
    if (reduced) this.pointerCurrent.set(0, 0);
    else this.pointerCurrent.lerp(this.pointer, 1 - Math.exp(-dt * 2));
    const entry = reduced ? 0 : Math.min(seconds / 8, 1);
    this.camera.position.set(
      this.pointerCurrent.x * 0.85 + Math.sin(t * 0.055) * 0.3,
      7.2 - entry * 0.7 - this.pointerCurrent.y * 0.3,
      23 - entry * 2,
    );
    this.camera.lookAt(this.pointerCurrent.x * 0.2, 5, -32);
    this.camera.updateMatrixWorld();
    this.sky.uniforms.uTime.value = t;
    this.sky.uniforms.uEnergy.value = reduced ? 0 : this.energy;
    this.waterMaterial.uniforms.uTime.value = t;
    this.animateSurroundings?.(
      t,
      reduced ? 0 : this.energy,
      reduced ? 0 : this.gestureEnergy,
    );
    this.energy *= Math.exp(-dt * 1.8);
    this.gestureEnergy *= Math.exp(-dt);
    const burstPositions = this.bursts.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const burstAlpha = this.bursts.geometry.getAttribute(
      "aAlpha",
    ) as THREE.BufferAttribute;
    for (let slot = 0; slot < 8; slot++) {
      const origin = this.burstOrigins[slot],
        age = t - origin.w;
      const alpha = reduced || age < 0 ? 0 : Math.max(0, 1 - age / 3);
      for (let p = 0; p < 12; p++) {
        const angle = (p * Math.PI) / 6,
          spread = age * 0.65;
        burstPositions.setXYZ(
          slot * 12 + p,
          origin.x + Math.cos(angle) * spread,
          origin.y + age * 0.6 + Math.sin(angle * 2) * spread * 0.2,
          origin.z + Math.sin(angle) * spread,
        );
        burstAlpha.setX(slot * 12 + p, alpha);
      }
    }
    burstPositions.needsUpdate = true;
    burstAlpha.needsUpdate = true;
    for (const trail of this.trails) {
      const opacity = reduced
        ? 0
        : Math.max(0, 1 - (seconds - trail.lastNote) / 5);
      trail.points.material.uniforms.uOpacity.value = opacity;
      if (dt > 0 && opacity > 0) {
        trail.head.lerp(trail.target, 1 - Math.exp(-dt * 1.8));
        const attr = trail.points.geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        const positions = attr.array as Float32Array;
        positions.copyWithin(3, 0, positions.length - 3);
        trail.head.toArray(positions, 0);
        attr.needsUpdate = true;
      }
    }
    const attr = this.fireflies.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    for (let i = 0; i < this.flyOrigins.length; i += 3) {
      attr.setXYZ(
        i / 3,
        this.flyOrigins[i] + Math.sin(t * 0.15 + i) * 0.7,
        this.flyOrigins[i + 1] + Math.sin(t * 0.32 + i) * 0.4,
        this.flyOrigins[i + 2] + Math.cos(t * 0.1 + i) * 0.6,
      );
    }
    attr.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    if (this.failed) throw new Error("Scene shader unavailable");
    // Only downgrade after sustained cost; never oscillate quality during a session.
    this.cost += performance.now() - start;
    if (++this.samples === 120) {
      if (this.cost / this.samples > 24 && this.quality > 0.65) {
        this.quality *= 0.8;
        this.resizePending = true;
      }
      this.samples = 0;
      this.cost = 0;
    }
    return this.canvas;
  }
  get diagnostics() {
    return {
      scene: this.kind,
      quality: this.quality,
      pixels: this.canvas.width * this.canvas.height,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      drawCalls: this.renderer.info.render.calls,
    };
  }
  private contextLost = (event: Event) => {
    event.preventDefault();
    this.failed = true;
    this.onLost();
  };
  private disposeScene() {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    this.scene.traverse((object) => {
      // Instance attributes are separate GPU buffers, not geometry attributes.
      if (object instanceof THREE.InstancedMesh) object.dispose();
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.Line
      ) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
      }
    });
    this.water?.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    this.scene.clear();
    this.renderer.renderLists.dispose();
  }
  dispose() {
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.disposeScene();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
