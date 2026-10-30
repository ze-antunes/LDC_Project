import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Box3 } from "three";
import { FLIGHT_BOUNDS as B } from "../src/javascript/data/geography.js";
import { stepFlight } from "../src/javascript/data/flight.js";
import {
  wrapCoordinate,
  nearestWorldPosition,
  worldDistance,
  cameraRebase,
  chunkSlots,
  WORLD_WIDTH,
  WORLD_DEPTH,
  CHUNK_SIZE,
  CHUNK_COLUMNS,
  CHUNK_ROWS,
} from "../src/javascript/data/worldStream.js";
import { clipTriangle } from "../scripts/lib/clip-geometry.mjs";
const manifest = JSON.parse(
  readFileSync(
    new URL("../public/world/manifest.json", import.meta.url),
    "utf8",
  ),
);
const base = () => ({
  x: 0,
  y: 6,
  z: 0,
  heading: 0,
  pitch: 0,
  bank: 0,
  speed: 8,
  paused: false,
});
test("crossing an edge wraps position without steering or stopping the aircraft", () => {
  const f = { ...base(), x: B.maxX - 0.01, heading: -Math.PI / 2 };
  const before = { ...f };
  stepFlight(f, {}, 0.05);
  assert.ok(f.x >= B.minX && f.x < B.minX + 1);
  assert.equal(f.heading, before.heading);
  assert.equal(f.speed, 8);
  assert.deepEqual(cameraRebase(before, f), [-WORLD_WIDTH, 0]);
  const north = { ...base(), z: B.minZ + 0.01 };
  stepFlight(north, {}, 0.05);
  assert.ok(north.z > B.maxZ - 1 && north.z < B.maxZ);
  assert.equal(north.heading, 0);
});
test("wrapping handles several world periods and nearest data images remain close across seams", () => {
  assert.equal(wrapCoordinate(B.maxX, B.minX, B.maxX), B.minX);
  assert.ok(
    Math.abs(
      wrapCoordinate(B.minX - WORLD_WIDTH * 3 + 2, B.minX, B.maxX) -
        (B.minX + 2),
    ) < 1e-8,
  );
  const p = nearestWorldPosition([B.minX + 1, 0, 0], { x: B.maxX - 1, z: 0 });
  assert.equal(p[0], B.maxX + 1);
  assert.equal(worldDistance(B.minX + 1, 0, B.maxX - 1, 0), 2);
});
test("chunk selection follows position, is bounded, and reuses canonical geographic assets across edges", () => {
  const local = chunkSlots(0, 0, 48),
    shifted = chunkSlots(96, 0, 48),
    edge = chunkSlots(B.maxX - 1, 0, 48);
  assert.ok(local.length < CHUNK_COLUMNS * CHUNK_ROWS);
  assert.notDeepEqual(
    local.map((c) => c.key),
    shifted.map((c) => c.key),
  );
  assert.equal(new Set(edge.map((c) => c.key)).size, edge.length);
  assert.ok(edge.some((c) => c.x >= B.maxX && c.id.startsWith("0-")));
  assert.ok(
    edge.every((c) => {
      const [x, z] = c.id.split("-").map(Number);
      return x >= 0 && x < CHUNK_COLUMNS && z >= 0 && z < CHUNK_ROWS;
    }),
  );
  assert.equal(WORLD_DEPTH, CHUNK_ROWS * CHUNK_SIZE);
});
const area = (triangle) => {
  const [a, b, c] = triangle;
  return (
    Math.abs((b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0])) / 2
  );
};
test("terrain clipping preserves triangle area and does not mutate the source", () => {
  const tri = [
      [-1, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 1, 0],
      [0, 0, 2, 0, 1, 0],
    ],
    before = structuredClone(tri);
  const left = clipTriangle(tri, -1, 0, 0, 2),
    right = clipTriangle(tri, 0, 1, 0, 2);
  assert.ok(
    Math.abs(
      [...left, ...right].reduce((sum, t) => sum + area(t), 0) - area(tri),
    ) < 1e-10,
  );
  assert.deepEqual(tri, before);
  assert.ok(
    left.flat().every((v) => v[0] <= 0 && v[0] >= -1 && v[2] >= 0 && v[2] <= 2),
  );
});
test("the generated manifest matches the flight world and chunk meshes stay inside their sectors", async () => {
  assert.equal(manifest.columns, CHUNK_COLUMNS);
  assert.equal(manifest.rows, CHUNK_ROWS);
  assert.equal(Object.keys(manifest.tiles).length, 201);
  const tiles = Object.values(manifest.tiles);
  for (const tile of [
    tiles[0],
    tiles[Math.floor(tiles.length / 2)],
    tiles.at(-1),
  ]) {
    const bytes = readFileSync(
      new URL("../public/" + tile.url, import.meta.url),
    );
    const { scene } = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    const box = new Box3().setFromObject(scene);
    assert.ok(box.min.x >= -0.0001 && box.max.x <= CHUNK_SIZE + 0.0001);
    assert.ok(box.min.z >= -0.0001 && box.max.z <= CHUNK_SIZE + 0.0001);
  }
});


test("polar hit areas never select Antarctica over the Atlantic or Mediterranean", async () => {
  const { feature } = await import("topojson-client");
  const { geographicPosition, countryContainsMapPoint } = await import("../src/javascript/data/geography.js");
  const topology = JSON.parse(readFileSync(new URL("../public/data/countries-110m.json", import.meta.url)));
  const countries = feature(topology, topology.objects.countries).features;
  const antarctica = countries.find(f => String(f.id) === "010");
  for (const [lon, lat] of [[-30, 30], [15, 35], [0, 0]]) {
    const [x, , z] = geographicPosition(lon, lat);
    assert.equal(countryContainsMapPoint(antarctica, x, z), false);
  }
  const [x, , z] = geographicPosition(0, -85);
  assert.equal(countryContainsMapPoint(antarctica, x, z), true);
  const portugal = countries.find(f => String(f.id) === "620");
  const [px, , pz] = geographicPosition(-8, 39.5);
  assert.equal(countryContainsMapPoint(portugal, px, pz), true);
});
