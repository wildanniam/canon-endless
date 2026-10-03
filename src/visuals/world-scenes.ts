import * as T from "three";
import { random } from "../music/random";
import type { Scene } from "../settings";

type Animate = (time: number, energy: number, gesture: number) => void;
const dummy = new T.Object3D();

/** Scene-owned geometry only. The shared world owns disposal and rendering. */
export function buildSurroundings(
  id: Exclude<Scene, "aurora">,
  scene: T.Group,
): Animate {
  const rng = random(`surroundings-${id}-v1`),
    animations: Animate[] = [];
  const add = (object: T.Object3D) => {
    scene.add(object);
    return object;
  };
  const material = (color: string) =>
    new T.MeshLambertMaterial({ color, flatShading: true });
  function ridge(z: number, palette: string, height: number, seedOffset = 0) {
    const positions: number[] = [],
      colors: number[] = [],
      base = new T.Color(palette);
    const tops = Array.from({ length: 41 }, (_, i) => {
      const x = (i - 20) * 8;
      const peak =
        id === "mountain"
          ? 12 * Math.exp(-(((x + 22 + seedOffset) / 28) ** 2))
          : 0;
      return new T.Vector3(
        x,
        2 + Math.abs(x) * 0.07 + rng() * height + peak,
        z + rng() * 8,
      );
    });
    for (let i = 0; i < 40; i++) {
      const a = tops[i],
        b = tops[i + 1],
        lowA = new T.Vector3(a.x, id === "mountain" ? -40 : -12, z + 10),
        lowB = new T.Vector3(b.x, id === "mountain" ? -40 : -12, z + 10);
      for (const triangle of [
        [a, lowA, b],
        [b, lowA, lowB],
      ]) {
        const c = base.clone().multiplyScalar(0.78 + rng() * 0.3);
        for (const p of triangle) {
          positions.push(p.x, p.y, p.z);
          colors.push(c.r, c.g, c.b);
        }
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    add(
      new T.Mesh(
        geometry,
        new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide }),
      ),
    );
  }
  function ground(color: string, y = 0) {
    const mesh = new T.Mesh(new T.PlaneGeometry(400, 400), material(color));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    add(mesh);
  }
  function banks(color: string, gap: number, winding: number) {
    for (const side of [-1, 1]) {
      const geometry = new T.PlaneGeometry(42, 110, 12, 35);
      geometry.rotateX(-Math.PI / 2);
      const p = geometry.getAttribute("position");
      for (let i = 0; i < p.count; i++) {
        const u = (p.getX(i) + 21) / 42,
          z = p.getZ(i) - 30;
        const center = Math.sin(z * 0.075) * winding;
        p.setXYZ(
          i,
          center + side * (gap + u * 42 + Math.sin(z * 0.17) * 0.7),
          0.05 + u * 1.6 + Math.sin(z * 0.1 + u * 2) * u * 0.25,
          z,
        );
      }
      // Mirroring the left bank reverses triangle winding; keep its top visible.
      if (side < 0) {
        const index = geometry.getIndex()!;
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i);
          index.setX(i, index.getX(i + 2));
          index.setX(i + 2, a);
        }
      }
      geometry.computeVertexNormals();
      add(new T.Mesh(geometry, material(color)));
    }
  }
  function trees(
    count: number,
    kind: "broad" | "cherry" | "pine",
    spread: number,
  ) {
    const trunk = new T.InstancedMesh(
      new T.CylinderGeometry(0.12, 0.23, 1, 6),
      material(kind === "cherry" ? "#66504d" : "#3e5140"),
      count * 3,
    );
    const leafGeometry =
      kind === "pine"
        ? new T.ConeGeometry(1, 1, 6)
        : new T.IcosahedronGeometry(1, 1);
    const leaves = new T.InstancedMesh(
      leafGeometry,
      material("#ffffff"),
      count * 4,
    );
    for (let i = 0; i < count; i++) {
      const z = id === "rain" ? -65 + rng() * 40 : -60 + rng() * 76,
        side = i % 2 ? 1 : -1;
      const x =
        side * (spread + rng() * 17) +
        (kind === "cherry" ? Math.sin(z * 0.075) * 2 : 0);
      const h =
        kind === "broad"
          ? (id === "rain" ? 6 + rng() * 6 : 12 + rng() * 12)
          : kind === "cherry"
            ? 5 + rng() * 5
            : 3 + rng() * 7;
      const base = id === "forest" ? 0 : 0.5;
      const up = new T.Vector3(0, 1, 0);
      for (let branch = 0; branch < 3; branch++) {
        const start = new T.Vector3(x, base + (branch === 0 ? 0 : h * 0.48), z);
        const end = new T.Vector3(
          x + (branch === 0 ? 0 : (branch === 1 ? -1 : 1) * h * 0.23),
          base + h * (branch === 0 ? 0.84 : 0.8),
          z + (branch === 0 ? 0 : h * 0.08),
        );
        const direction = end.clone().sub(start);
        dummy.position.copy(start).add(end).multiplyScalar(0.5);
        dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
        dummy.scale.set(h * 0.12, direction.length(), h * 0.12);
        dummy.updateMatrix();
        trunk.setMatrixAt(i * 3 + branch, dummy.matrix);
      }
      for (let crown = 0; crown < 4; crown++) {
        const angle = crown * 2.1;
        dummy.position.set(
          x + Math.cos(angle) * h * 0.18,
          base + h * (0.79 + crown * 0.045),
          z + Math.sin(angle) * h * 0.18,
        );
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(h * 0.31, h * (kind === "pine" ? 0.53 : 0.22), h * 0.28);
        dummy.updateMatrix();
        leaves.setMatrixAt(i * 4 + crown, dummy.matrix);
        leaves.setColorAt(
          i * 4 + crown,
          new T.Color(
            kind === "cherry"
              ? ["#e2a8bc", "#f6c4cd", "#d99db7", "#edb0bd"][crown]
              : ["#426a48", "#7b985a", "#61844e", "#a0a66c"][crown],
          ),
        );
      }
    }
    add(trunk);
    add(leaves);
  }
  function mist(color: string, opacity: number, count: number, y: number) {
    const mat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new T.Color(color) },
        uOpacity: { value: opacity },
      },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:
        `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uOpacity;void main(){float edge=pow(max(0.,sin(vUv.x*3.14159)),1.5)*pow(max(0.,sin(vUv.y*3.14159)),2.);float w=.55+.2*sin(vUv.x*15.+uTime*.12)+.25*sin(vUv.x*27.-uTime*.18+vUv.y*3.);gl_FragColor=vec4(uColor,edge*w*uOpacity);#include <colorspace_fragment>}`.replace(
          ";#include",
          ";\n#include",
        ),
    });
    for (let i = 0; i < count; i++) {
      const plane = new T.Mesh(new T.PlaneGeometry(95, 8 + i * 3), mat);
      plane.position.set((i % 2 ? 1 : -1) * 10, y + i * 0.7, -18 - i * 22);
      add(plane);
      animations.push((t) => {
        plane.position.x = Math.sin(t * 0.025 + i * 2) * 12;
      });
    }
    animations.push((t) => {
      mat.uniforms.uTime.value = t;
    });
  }
  function grasses(count: number, color: string, gap: number, flowers = false) {
    const wind = { value: 0 },
      mat = material(color);
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = wind;
      shader.vertexShader = "uniform float uWind;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ntransformed.x += sin(uWind+instanceMatrix[3].x*.7+instanceMatrix[3].z*.3)*max(0.,position.y+.5)*.16;",
      );
    };
    mat.customProgramCacheKey = () => "meadow-wind-v1";
    const blades = new T.InstancedMesh(
      new T.ConeGeometry(0.12, 1, 3),
      mat,
      count,
    );
    const petals = flowers
      ? new T.InstancedMesh(
          new T.IcosahedronGeometry(0.12, 0),
          material("#efe4ac"),
          Math.floor(count / 4),
        )
      : undefined;
    for (let i = 0; i < count; i++) {
      const z = -38 + rng() * 60,
        side = i % 2 ? 1 : -1,
        x = side * (gap + rng() * 22) + Math.sin(z * 0.075) * 2;
      const h = 0.5 + rng() * 1.6;
      const base = id === "forest" ? 0.04 : 0.15 + Math.max(0, Math.abs(x - Math.sin(z * 0.075) * 2) - gap) / 42 * 1.6;
      dummy.position.set(x, h * 0.5 + base, z);
      dummy.rotation.set(0, rng() * 6, (rng() - 0.5) * 0.4);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      blades.setMatrixAt(i, dummy.matrix);
      if (petals && i % 4 === 0) {
        dummy.position.y = h + base;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.4, 0.7, 1.4);
        dummy.updateMatrix();
        petals.setMatrixAt(i / 4, dummy.matrix);
        petals.setColorAt(
          i / 4,
          new T.Color(i % 8 === 0 ? "#d8c298" : "#bfa5d8"),
        );
      }
    }
    add(blades);
    if (petals) add(petals);
    animations.push((t) => {
      wind.value = t * 0.9;
    });
  }
  function birds(count: number, color: string) {
    const data = Array.from({ length: count }, (_, i) => ({
      phase: rng() * 6,
      z: -50 - rng() * 45,
      y: 16 + rng() * 12,
      x: i * 4,
    }));
    const geometry = new T.BufferGeometry();
    const positions = new Float32Array(count * 12);
    geometry.setAttribute(
      "position",
      new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage),
    );
    add(
      new T.LineSegments(
        geometry,
        new T.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }),
      ),
    );
    animations.push((t) => {
      const p = geometry.getAttribute("position");
      data.forEach((bird, i) => {
        const x = ((t * 0.65 + bird.x + 60) % 120) - 60,
          y = bird.y + Math.sin(t * 0.16 + bird.phase);
        const wing = Math.sin(t * 3.5 + bird.phase) * 0.4;
        for (let j = 0; j < 4; j++) {
          p.setXYZ(
            i * 4 + j,
            x + [-0.7, 0, 0, 0.7][j],
            y + ([0, 3].includes(j) ? wing : 0),
            bird.z,
          );
        }
      });
      p.needsUpdate = true;
    });
  }
  function petals() {
    const count = 160,
      data = Array.from({ length: count }, () => ({
        x: (rng() - 0.5) * 60,
        y: rng() * 22,
        z: -45 + rng() * 61,
        phase: rng() * 6,
      }));
    const shape = new T.Shape();
    shape.moveTo(-0.13, 0);
    shape.quadraticCurveTo(0, 0.12, 0.13, 0);
    shape.quadraticCurveTo(0, -0.1, -0.13, 0);
    const mesh = new T.InstancedMesh(
      new T.ShapeGeometry(shape, 3),
      new T.MeshLambertMaterial({ color: "#f6bacd", side: T.DoubleSide }),
      count,
    );
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    add(mesh);
    animations.push((t, _, gesture) => {
      data.forEach((p, i) => {
        const y = (((p.y - t * 0.55) % 22) + 22) % 22;
        dummy.position.set(
          ((p.x + t * 0.5 + 30) % 60) -
            30 +
            Math.sin(t * 0.4 + p.phase) * (1 + gesture),
          y,
          p.z + Math.sin(t * 0.25 + p.phase),
        );
        dummy.rotation.set(
          t * 0.45 + p.phase,
          t * 0.3 + p.phase,
          Math.sin(t + p.phase),
        );
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }
  function rain() {
    const count = 240,
      origins = Array.from({ length: count }, () => ({
        x: (rng() - 0.5) * 66,
        y: rng() * 28,
        z: -48 + rng() * 69,
      }));
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.BufferAttribute(new Float32Array(count * 6), 3).setUsage(
        T.DynamicDrawUsage,
      ),
    );
    add(
      new T.LineSegments(
        geometry,
        new T.LineBasicMaterial({
          color: "#d9e9e6",
          transparent: true,
          opacity: 0.32,
        }),
      ),
    );
    animations.push((t) => {
      const p = geometry.getAttribute("position");
      origins.forEach((o, i) => {
        const y = (((o.y - t * 7) % 28) + 28) % 28,
          x = o.x + Math.sin(t * 0.13) * 0.8;
        p.setXYZ(i * 2, x, y, o.z);
        p.setXYZ(i * 2 + 1, x + 0.08, y - 0.85, o.z);
      });
      p.needsUpdate = true;
    });
  }
  if (id === "lake") {
    ridge(-135, "#abb8a0", 13);
    ridge(-92, "#8d9f83", 12);
    ridge(-58, "#72886b", 7);
    banks("#7f946f", 16, 1);
    trees(30, "pine", 20);
    grasses(220, "#638358", 17);
    const pads = new T.InstancedMesh(
      new T.CircleGeometry(0.7, 12, 0.13, Math.PI * 1.86),
      new T.MeshLambertMaterial({ color: "#5f886a", side: T.DoubleSide }),
      38,
    );
    for (let i = 0; i < 38; i++) {
      dummy.position.set(
        (i % 2 ? 1 : -1) * (9 + rng() * 8),
        0.025,
        -13 + rng() * 29,
      );
      dummy.rotation.set(-Math.PI / 2, 0, rng() * 6);
      dummy.scale.setScalar(0.6 + rng() * 0.6);
      dummy.updateMatrix();
      pads.setMatrixAt(i, dummy.matrix);
    }
    add(pads);
    mist("#f0e6ca", 0.23, 3, 1.4);
    birds(9, "#596c58");
  } else if (id === "forest") {
    ground("#48633f");
    ridge(-95, "#7f956c", 16);
    const path = new T.PlaneGeometry(9, 130, 1, 40);
    path.rotateX(-Math.PI / 2);
    const p = path.getAttribute("position");
    for (let i = 0; i < p.count; i++)
      p.setXYZ(
        i,
        p.getX(i) + Math.sin(p.getZ(i) * 0.06) * 2,
        0.025,
        p.getZ(i) - 38,
      );
    add(new T.Mesh(path, material("#536c47")));
    trees(64, "broad", 7);
    grasses(250, "#44643b", 6, true);
    mist("#e4deb2", 0.13, 3, 4);
    const shaftMat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vUv;uniform float uTime;void main(){float a=pow(sin(vUv.x*3.14159),2.)*sin(vUv.y*3.14159)*(.18+.015*sin(uTime*.25));gl_FragColor=vec4(.94,.90,.57,a);}`,
    });
    for (let i = 0; i < 5; i++) {
      const beam = new T.Mesh(new T.PlaneGeometry(3 + i * 0.5, 36), shaftMat);
      beam.rotation.z = -0.38;
      beam.position.set(-8 + i * 7, 13, -12 - i * 8);
      add(beam);
    }
    animations.push((t) => {
      shaftMat.uniforms.uTime.value = t;
    });
  } else if (id === "mountain") {
    ground("#777184", -10);
    ridge(-170, "#cbb0a1", 27, -40);
    ridge(-115, "#b1908c", 29, 10);
    ridge(-75, "#916b73", 24, -20);
    ridge(-40, "#694f64", 14, 55);
    const rock = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 0),
      material("#655263"),
      14,
    );
    for (let i = 0; i < 14; i++) {
      dummy.position.set(
        (i % 2 ? 1 : -1) * (16 + rng() * 14),
        -3,
        -8 + rng() * 25,
      );
      dummy.rotation.set(rng(), rng() * 5, 0);
      dummy.scale.set(5 + rng() * 6, 4 + rng() * 5, 5 + rng() * 4);
      dummy.updateMatrix();
      rock.setMatrixAt(i, dummy.matrix);
    }
    add(rock);
    mist("#e9c0ad", 0.36, 5, 2);
    mist("#c1a1ad", 0.4, 2, -5);
    birds(16, "#5b465b");
  } else if (id === "blossom") {
    ridge(-135, "#c4afb9", 12);
    ridge(-82, "#a694a4", 10);
    banks("#94a080", 11, 2);
    trees(24, "cherry", 13);
    grasses(180, "#7c926e", 13, true);
    petals();
    mist("#f4d4db", 0.1, 2, 1);
  } else {
    ridge(-130, "#92aa9d", 13);
    ridge(-82, "#799585", 10);
    ridge(-55, "#67816c", 5);
    banks("#708c65", 4, 2);
    grasses(650, "#5d8157", 5, true);
    trees(7, "broad", 28);
    rain();
    mist("#dce4da", 0.14, 3, 1.5);
  }
  return (time, energy, gesture) => {
    for (const animate of animations) animate(time, energy, gesture);
  };
}
