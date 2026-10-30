import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { feature } from "topojson-client";
import { indexCountryEvents } from "../src/javascript/data/countries.js";
import { parseBattles } from "../src/javascript/data/battles.js";
const topology = JSON.parse(
  readFileSync(
    new URL("../public/data/countries-110m.json", import.meta.url),
    "utf8",
  ),
);
const features = feature(topology, topology.objects.countries).features;
const records = parseBattles(
  readFileSync(
    new URL(
      "../src/WW2_LocationData_Clean - GeoBattleData_YZ.csv",
      import.meta.url,
    ),
    "utf8",
  ),
);
test("country summaries preserve all records, including coordinates outside simplified polygons", () => {
  const result = indexCountryEvents(records, features);
  const assigned = result.countries.flatMap((c) => c.events);
  assert.equal(assigned.length + result.unassigned.length, records.length);
  assert.equal(
    new Set([...assigned, ...result.unassigned].map((b) => b.id)).size,
    records.length,
  );
  assert.ok(result.unassigned.length > 0);
  const egypt = result.countries.find((c) => c.id === "818");
  assert.ok(egypt.events.some((b) => b.name === "EL ALAMEIN II"));
});
test("a country with no records stays empty instead of receiving nearby island or ocean events", () => {
  const portugal = features.find((f) => f.id === "620");
  const result = indexCountryEvents(
    [{ id: "ocean", longitude: -30, latitude: 10, campaign: "Example" }],
    [portugal],
  );
  assert.equal(result.countries[0].events.length, 0);
  assert.equal(result.unassigned.length, 1);
});
