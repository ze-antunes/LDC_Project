import test from "node:test";
import assert from "node:assert/strict";
import { stepFlight } from "../src/javascript/data/flight.js";
import { FLIGHT_BOUNDS as B } from "../src/javascript/data/geography.js";

const plane = speed => ({x: 0, y: 14.99, z: 0, heading: 0, pitch: 0.45, bank: 0, speed, paused: false});
test("the altitude ceiling triggers a half loop and half roll that reverse heading and a smooth recovery to 13", () => {
  for (const speed of [1, 4, 8]) {
    const f = plane(speed);
    stepFlight(f, {backward: true}, 0.05);
    assert.equal(B.maxY, 15);
    assert.equal(f.y, 15);
    assert.equal(f.maneuver.phase, "loop");
    let halfLoop = false, halfRoll = false, noseDown = false, steps = 0;
    while (f.maneuver && steps++ < 250) {
      stepFlight(f, {backward: true, right: true, accelerate: true}, 0.05);
      assert.ok(f.y <= 15 && f.y >= 13 - 1e-8);
      halfLoop ||= f.pitch > Math.PI;
      halfRoll ||= f.bank > Math.PI * 0.95;
      noseDown ||= f.maneuver?.phase === "descent" && f.pitch < 0;
    }
    assert.ok(halfLoop && halfRoll && noseDown);
    assert.ok(steps < 250);
    assert.equal(f.y, 13);
    assert.equal(f.pitch, 0);
    assert.equal(f.heading, Math.PI);
    const beforeZ = f.z;
    stepFlight(f, {}, 0.05);
    assert.ok(f.z > beforeZ, "forward flight now travels in the opposite direction");
    assert.equal(f.speed, speed);
  }
});
test("pausing freezes a ceiling maneuver and resuming continues it", () => {
  const f = plane(4);
  stepFlight(f, {backward: true}, 0.05);
  stepFlight(f, {}, 0.05);
  f.paused = true;
  const before = structuredClone(f);
  for (let i = 0; i < 20; i++) stepFlight(f, {}, 0.05);
  assert.deepEqual(f, before);
  f.paused = false;
  stepFlight(f, {}, 0.05);
  assert.ok(f.maneuver.elapsed > before.maneuver.elapsed);
});


test("the U-turn reverses arbitrary entry headings, not just north", () => {
  for (const heading of [0.7, -2.1, 7.3]) {
    const f = { ...plane(4), heading };
    stepFlight(f, {backward: true}, 0.05);
    for (let i = 0; f.maneuver && i < 250; i++) stepFlight(f, {}, 0.05);
    assert.ok(Math.abs(f.heading - heading - Math.PI) < 1e-10);
    assert.equal(f.bank, 0);
    assert.equal(f.y, 13);
    assert.equal(f.cameraHeading, undefined);
  }
});
