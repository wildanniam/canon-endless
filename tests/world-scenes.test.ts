import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildSurroundings } from "../src/visuals/world-scenes";

// Exercise procedural frame data without a GPU. Browser checks cover actual
// pixels, context fallback and GPU disposal (see docs/verification.md).
function frame(group: THREE.Group) {
  const values: number[] = [];
  group.traverse((object) => {
    values.push(...object.position.toArray(), ...object.quaternion.toArray());
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      const position = object.geometry.getAttribute("position");
      for (let i = 0; i < position.array.length; i++) values.push(position.array[i]);
    }
    if (object instanceof THREE.InstancedMesh) {
      for (const value of object.instanceMatrix.array) values.push(value);
    }
  });
  return values;
}

describe("procedural world animation contract", () => {
  it.each(["lake", "forest", "mountain", "blossom", "rain"] as const)(
    "%s uses supplied time, keeps finite frame data and reuses geometry",
    (scene) => {
      const group = new THREE.Group();
      const animate = buildSurroundings(scene, group);
      const objects: THREE.Object3D[] = [];
      group.traverse((object) => objects.push(object));
      const geometry = objects.flatMap((object) =>
        object instanceof THREE.Mesh || object instanceof THREE.Line
          ? [object.geometry]
          : [],
      );
      animate(0, 0, 0);
      const initial = frame(group);
      for (const time of [1, 20, 3600, 7200]) {
        animate(time, 0.4, 0.5);
        const moving = frame(group);
        expect(moving.every(Number.isFinite)).toBe(true);
        expect(moving).not.toEqual(initial);
        animate(time, 0.4, 0.5);
        expect(frame(group)).toEqual(moving);
      }
      const after: THREE.Object3D[] = [];
      group.traverse((object) => after.push(object));
      expect(after).toEqual(objects);
      expect(after.flatMap((object) =>
        object instanceof THREE.Mesh || object instanceof THREE.Line
          ? [object.geometry]
          : [],
      )).toEqual(geometry);
      group.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) object.dispose();
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material) ? object.material : [object.material])
            material.dispose();
        }
      });
    },
  );
});
