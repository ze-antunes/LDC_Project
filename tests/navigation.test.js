import test from "node:test";
import assert from "node:assert/strict";
import { compassHeading, relativeBearing, bearingTo, compassPoint } from "../src/javascript/data/navigation.js";
import { nearestWorldPosition } from "../src/javascript/data/worldStream.js";
import { FLIGHT_BOUNDS as B } from "../src/javascript/data/geography.js";

test("compass follows the aircraft axes and wraps north without reversing east and west", () => {
  assert.equal(compassHeading(0), 0);
  assert.equal(compassHeading(-Math.PI / 2), 90);
  assert.equal(compassHeading(Math.PI / 2), 270);
  assert.equal(compassHeading(Math.PI), 180);
  assert.equal(compassPoint(270), "O");
  assert.equal(compassPoint(359), "N");
  assert.equal(relativeBearing(1, 359), 2);
  assert.equal(relativeBearing(359, 1), -2);
});
test("destination bearing uses the shortest direction at the map seam", () => {
  const origin = {x: B.maxX - 1, z: 0};
  const target = nearestWorldPosition([B.minX + 1, 0, 0], origin);
  assert.equal(bearingTo(origin, target), 90);
  assert.equal(bearingTo({x: 0, z: 0}, [0, 0, -10]), 0);
});
