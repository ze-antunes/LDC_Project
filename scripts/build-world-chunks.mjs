import { readFile, writeFile, mkdir } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
} from "three";
import {
  MAP_SCALE,
  ORIGINAL_ORIGIN,
  FLIGHT_BOUNDS as B,
} from "../src/javascript/data/geography.js";
import {
  CHUNK_SIZE,
  CHUNK_COLUMNS,
  CHUNK_ROWS,
} from "../src/javascript/data/worldStream.js";
import { clipTriangle } from "./lib/clip-geometry.mjs";
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};
const bytes = await readFile("public/map-original.glb");
const { scene } = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  "",
);
const buckets = new Map();
let inputTriangles = 0,
  outputTriangles = 0;
scene.updateMatrixWorld(true);
scene.traverse((object) => {
  if (!object.isMesh) return;
  let geometry = object.geometry
    .clone()
    .applyMatrix4(object.matrixWorld)
    .scale(MAP_SCALE, 40, MAP_SCALE)
    .translate(
      -ORIGINAL_ORIGIN[0] * MAP_SCALE,
      -0.15,
      -ORIGINAL_ORIGIN[1] * MAP_SCALE,
    );
  if (geometry.index) geometry = geometry.toNonIndexed();
  const p = geometry.attributes.position,
    n = geometry.attributes.normal;
  for (let i = 0; i < p.count; i += 3) {
    inputTriangles++;
    const triangle = [0, 1, 2].map((j) => [
      p.getX(i + j),
      p.getY(i + j),
      p.getZ(i + j),
      n.getX(i + j),
      n.getY(i + j),
      n.getZ(i + j),
    ]);
    const minCol = Math.max(
        0,
        Math.floor(
          (Math.min(...triangle.map((v) => v[0])) - B.minX) / CHUNK_SIZE,
        ),
      ),
      maxCol = Math.min(
        CHUNK_COLUMNS - 1,
        Math.floor(
          (Math.max(...triangle.map((v) => v[0])) - B.minX) / CHUNK_SIZE,
        ),
      );
    const minRow = Math.max(
        0,
        Math.floor(
          (Math.min(...triangle.map((v) => v[2])) - B.minZ) / CHUNK_SIZE,
        ),
      ),
      maxRow = Math.min(
        CHUNK_ROWS - 1,
        Math.floor(
          (Math.max(...triangle.map((v) => v[2])) - B.minZ) / CHUNK_SIZE,
        ),
      );
    for (let col = minCol; col <= maxCol; col++)
      for (let row = minRow; row <= maxRow; row++) {
        const x = B.minX + col * CHUNK_SIZE,
          z = B.minZ + row * CHUNK_SIZE,
          id = `${col}-${row}`;
        const clipped = clipTriangle(
          triangle,
          x,
          x + CHUNK_SIZE,
          z,
          z + CHUNK_SIZE,
        );
        if (!clipped.length) continue;
        if (!buckets.has(id))
          buckets.set(id, { id, col, row, x, z, positions: [], normals: [] });
        const bucket = buckets.get(id);
        for (const tri of clipped) {
          const a = tri[0],
            b = tri[1],
            c = tri[2];
          const ux = b[0] - a[0],
            uy = b[1] - a[1],
            uz = b[2] - a[2],
            vx = c[0] - a[0],
            vy = c[1] - a[1],
            vz = c[2] - a[2];
          if (
            Math.hypot(
              uy * vz - uz * vy,
              uz * vx - ux * vz,
              ux * vy - uy * vx,
            ) < 1e-9
          )
            continue;
          for (const v of tri) {
            bucket.positions.push(v[0] - x, v[1], v[2] - z);
            const length = Math.hypot(v[3], v[4], v[5]) || 1;
            bucket.normals.push(v[3] / length, v[4] / length, v[5] / length);
          }
          outputTriangles++;
        }
      }
  }
});
await mkdir("public/world/chunks", { recursive: true });
const manifest = {
  chunkSize: CHUNK_SIZE,
  bounds: B,
  columns: CHUNK_COLUMNS,
  rows: CHUNK_ROWS,
  tiles: {},
};
for (const bucket of buckets.values()) {
  if (!bucket.positions.length) continue;
  const geometry = new BufferGeometry()
    .setAttribute("position", new Float32BufferAttribute(bucket.positions, 3))
    .setAttribute("normal", new Float32BufferAttribute(bucket.normals, 3));
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: "#555555", roughness: 0.85 }),
  );
  mesh.name = `land-${bucket.id}`;
  const output = await new GLTFExporter().parseAsync(mesh, { binary: true });
  await writeFile(
    `public/world/chunks/${bucket.id}.glb`,
    new Uint8Array(output),
  );
  manifest.tiles[bucket.id] = {
    url: `world/chunks/${bucket.id}.glb`,
    triangles: bucket.positions.length / 9,
  };
}
await writeFile("public/world/manifest.json", JSON.stringify(manifest));
console.log(
  "World chunks:",
  Object.keys(manifest.tiles).length,
  "triangles:",
  inputTriangles,
  "->",
  outputTriangles,
);
