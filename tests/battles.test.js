import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseBattles,
  filterBattles,
  numberOrNull,
  fractionalDate,
  mapPosition,
} from "../src/javascript/data/battles.js";
const csv = readFileSync(
  new URL(
    "../src/WW2_LocationData_Clean - GeoBattleData_YZ.csv",
    import.meta.url,
  ),
  "utf8",
);
const battles = parseBattles(csv);

test("the complete CSV remains available with unique, chronological records", () => {
  assert.equal(battles.length, 178);
  assert.equal(new Set(battles.map((b) => b.id)).size, 178);
  assert.equal(battles[0].year, 1940);
  assert.equal(battles.at(-1).year, 1945);
  assert.ok(battles.every((b, i) => !i || battles[i - 1].date <= b.date));
});
test("missing values stay distinct from zero and do not create partial casualty totals", () => {
  for (const value of ["", "NA", null, "bad", "-1"])
    assert.equal(numberOrNull(value), null);
  assert.equal(numberOrNull("0"), 0);
  for (const b of battles) {
    if (b.attackerLosses === null || b.defenderLosses === null)
      assert.equal(b.losses, null);
    else assert.equal(b.losses, b.attackerLosses + b.defenderLosses);
  }
});
test("known El Alamein data is attached to the correct geographic event", () => {
  const battle = battles.find((b) => b.name === "EL ALAMEIN II");
  assert.equal(battle.campaign, "NORTH AFRICA 1942");
  assert.equal(battle.theatre, "africa");
  assert.equal(battle.attackerLosses, 13560);
  assert.equal(battle.defenderLosses, 15995);
  assert.equal(battle.losses, 29555);
  const [x, y, z] = mapPosition(battle);
  assert.ok(x > 75 && x < 87);
  assert.equal(y, 0);
  assert.ok(z < -90 && z > -111);
});
test("fractional years respect leap years and UTC boundaries", () => {
  assert.equal(fractionalDate(1944).toISOString(), "1944-01-01T00:00:00.000Z");
  assert.equal(
    fractionalDate(1944.5).toISOString(),
    "1944-07-02T00:00:00.000Z",
  );
});
test("year, theatre and search filters intersect without reordering identities", () => {
  const filtered = filterBattles(battles, {
    year: "1942",
    theatre: "africa",
    query: "alamein",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "EL ALAMEIN II");
  assert.equal(
    filterBattles(battles, { query: "no-such-event-xyz" }).length,
    0,
  );
  assert.equal(filterBattles(battles, {}).length, 178);
});
test("invalid coordinates are rejected while valid negative longitudes are preserved", () => {
  const text =
    "iseq,date,long,lat,engagem,war,campn,acas_per,dcas_per\n1,1944,-1,45,Valid,WORLD WAR II,Test,0,NA\n2,1944,NA,45,Invalid,WORLD WAR II,Test,0,0\n3,1944,1,91,Invalid,WORLD WAR II,Test,0,0";
  const result = parseBattles(text);
  assert.equal(result.length, 1);
  assert.equal(result[0].longitude, -1);
  assert.equal(result[0].losses, null);
});
