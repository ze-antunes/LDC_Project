import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBattles } from "../src/javascript/data/battles.js";
import {
  relativeLosses,
  campaignGroups,
  coverageSummary,
  recordMetrics,
  comparisonInsight,
  suggestedComparison,
} from "../src/javascript/data/readings.js";
const records = parseBattles(
  readFileSync(
    new URL(
      "../src/WW2_LocationData_Clean - GeoBattleData_YZ.csv",
      import.meta.url,
    ),
    "utf8",
  ),
);
test("relative losses distinguish known zero from missing or zero denominator", () => {
  assert.equal(relativeLosses(0, 100), 0);
  assert.equal(relativeLosses(25, 100), 25);
  for (const [losses, strength] of [
    [null, 100],
    [10, null],
    [0, 0],
    [10, 0],
    [-1, 100],
    [10, -1],
    [undefined, 100],
  ])
    assert.equal(relativeLosses(losses, strength), null);
});
test("known El Alamein values produce the correct within-record comparison", () => {
  const battle = records.find((b) => b.name === "EL ALAMEIN II");
  const metrics = recordMetrics(battle);
  assert.equal(metrics.length, 6);
  assert.equal(metrics.find((m) => m.id === "attackerLosses").value, 13560);
  assert.ok(
    Math.abs(
      metrics.find((m) => m.id === "attackerRate").value -
        (13560 / 220476) * 100,
    ) < 1e-10,
  );
  assert.ok(
    Math.abs(
      metrics.find((m) => m.id === "defenderRate").value -
        (15995 / 105223) * 100,
    ) < 1e-10,
  );
});
test("campaign navigation separates names reused in different years without dropping records", () => {
  const groups = campaignGroups(records),
    ardenne = groups.filter((g) => g.name === "ARDENNES");
  assert.ok(ardenne.some((g) => g.year === 1940));
  assert.ok(ardenne.some((g) => g.year === 1944));
  assert.equal(groups.flatMap((g) => g.events).length, 178);
  assert.equal(
    new Set(groups.flatMap((g) => g.events.map((b) => b.id))).size,
    178,
  );
  assert.ok(
    groups.every((g) =>
      g.events.every(
        (b, i) => b.year === g.year && (!i || g.events[i - 1].date <= b.date),
      ),
    ),
  );
});
test("sample coverage counts records and completeness, without summing casualties", () => {
  const summary = coverageSummary(records);
  assert.equal(summary.total, 178);
  assert.equal(summary.campaigns, 50);
  assert.equal(summary.years.find((y) => y.year === 1944).count, 85);
  assert.ok(
    Math.abs(summary.years.reduce((sum, y) => sum + y.percent, 0) - 100) < 1e-8,
  );
  assert.equal(summary.strengthPairs, 177);
  assert.equal(summary.casualtyPairs, 173);
  assert.equal(Object.hasOwn(summary, "totalDeaths"), false);
});
test("an unavailable comparison produces a missing-data explanation", () => {
  const base = records[0];
  const missing = { ...base, attackerStrength: null };
  assert.match(comparisonInsight(base, missing), /Faltam valores/);
});

test("a suggested pair uses complete records from the same campaign and year", () => {
  const pair = suggestedComparison(records);
  assert.ok(pair);
  assert.notEqual(pair.first.id, pair.second.id);
  assert.equal(pair.first.campaign, pair.second.campaign);
  assert.equal(pair.first.year, pair.second.year);
  assert.ok(pair.first.date <= pair.second.date);
  assert.notEqual(
    relativeLosses(pair.first.attackerLosses, pair.first.attackerStrength),
    null,
  );
  assert.notEqual(
    relativeLosses(pair.second.defenderLosses, pair.second.defenderStrength),
    null,
  );
  assert.equal(suggestedComparison([]), null);
});
