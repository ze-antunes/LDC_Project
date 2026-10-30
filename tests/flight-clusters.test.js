import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Vector3, Euler } from "three";
import { parseBattles } from "../src/javascript/data/battles.js";
import {
  clusterBattles,
  nearbyCluster,
} from "../src/javascript/data/clusters.js";
import { stepFlight } from "../src/javascript/data/flight.js";
const records = parseBattles(
  readFileSync(
    new URL(
      "../src/WW2_LocationData_Clean - GeoBattleData_YZ.csv",
      import.meta.url,
    ),
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
  speed: 7,
  paused: false,
});
test("clustering preserves every record once, independently of input order", () => {
  const clusters = clusterBattles(records);
  assert.ok(clusters.length < records.length);
  const ids = clusters.flatMap((c) => c.events.map((b) => b.id));
  assert.equal(ids.length, records.length);
  assert.equal(new Set(ids).size, records.length);
  assert.deepEqual(clusters, clusterBattles([...records].reverse()));
  for (const c of clusters) assert.equal(c.count, c.events.length);
});
test("more records produce a larger original explosion", () => {
  const make = (n) =>
    Array.from({ length: n }, (_, i) => ({ ...records[0], id: String(i) }));
  const small = clusterBattles(make(1))[0],
    large = clusterBattles(make(8))[0];
  assert.ok(large.scale > small.scale);
  assert.ok(Math.abs(large.scale / small.scale - 2) < 1e-9);
});
test("proximity uses separate enter and exit distances to avoid flickering", () => {
  const cluster = { id: "zone", x: 0, z: 0 };
  assert.equal(nearbyCluster([cluster], 7, 0)?.id, "zone");
  assert.equal(nearbyCluster([cluster], 9, 0), null);
  assert.equal(nearbyCluster([cluster], 9, 0, "zone")?.id, "zone");
  assert.equal(nearbyCluster([cluster], 12, 0, "zone"), null);
});
test("a right turn banks the aircraft and changes its forward direction, without strafing", () => {
  const f = base();
  for (let i = 0; i < 60; i++) stepFlight(f, { right: true }, 1 / 60);
  assert.ok(f.bank < 0 && f.heading < 0 && f.x > 0 && f.z < 0);
  const old = { ...f };
  stepFlight(f, { right: true, backward: true }, 1 / 60);
  const nose = new Vector3(0, 0, -1)
    .applyEuler(new Euler(f.pitch, f.heading, f.bank, "YXZ"))
    .normalize();
  const motion = new Vector3(f.x - old.x, f.y - old.y, f.z - old.z).normalize();
  assert.ok(nose.dot(motion) > 0.99999);
});
test("pitch changes altitude, throttle is bounded, and pause stops all movement", () => {
  const f = base();
  for (let i = 0; i < 120; i++)
    stepFlight(f, { backward: true, accelerate: true }, 1 / 60);
  assert.ok(f.y > 6 && f.speed > 7);
  for (let i = 0; i < 1000; i++) stepFlight(f, { accelerate: true }, 1 / 60);
  assert.equal(f.speed, 8);
  f.paused = true;
  const paused = { ...f };
  stepFlight(f, { right: true, forward: true }, 0.05);
  assert.deepEqual(f, paused);
});
test("autopilot can reach a nearby target behind the aircraft without orbiting forever", () => {
  const f = base(),
    target = [0, 0, 6];
  let reached = false;
  for (let i = 0; i < 3600; i++) {
    stepFlight(f, {}, 1 / 60, target);
    if (Math.hypot(f.x - target[0], f.z - target[2]) < 3.5) {
      reached = true;
      break;
    }
  }
  assert.ok(reached);
});

test("free flight keeps its heading without any automatic cluster pull", () => {
  const f = { ...base(), speed: 2.8, heading: 0.7 };
  const heading = f.heading;
  for (let i = 0; i < 3600; i++) stepFlight(f, {}, 1 / 60);
  assert.equal(f.heading, heading);
  assert.equal(f.bank, 0);
});
