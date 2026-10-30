import { geoBounds, geoContains } from "d3";
const names = {
  "012": "Argélia",
  498: "Moldávia",
  250: "França",
  276: "Alemanha",
  380: "Itália",
  620: "Portugal",
  724: "Espanha",
  826: "Reino Unido",
  643: "Rússia",
  616: "Polónia",
  112: "Bielorrússia",
  804: "Ucrânia",
  818: "Egito",
  788: "Tunísia",
  504: "Marrocos",
  392: "Japão",
  156: "China",
  458: "Malásia",
  840: "Estados Unidos",
  642: "Roménia",
  528: "Países Baixos",
  "056": "Bélgica",
};
export const countryName = (feature) =>
  names[String(feature.id).padStart(3, "0")] || feature.properties.name;
export function indexCountryEvents(battles, features) {
  const entries = features.map((feature) => ({
    feature,
    bounds: geoBounds(feature),
    events: [],
  }));
  const unassigned = [];
  for (const battle of battles) {
    const x = battle.longitude,
      y = battle.latitude;
    const match = entries.find(
      ({ feature, bounds: [[west, south], [east, north]] }) =>
        y >= south &&
        y <= north &&
        (west <= east ? x >= west && x <= east : x >= west || x <= east) &&
        geoContains(feature, [x, y]),
    );
    if (match) match.events.push(battle);
    else unassigned.push(battle);
  }
  return {
    countries: entries.map(({ feature, events }) => ({
      id: String(feature.id),
      name: countryName(feature),
      events,
      campaigns: new Set(events.map((b) => b.campaign)).size,
    })),
    unassigned,
  };
}
const cache = new WeakMap();
export function countryIndex(battles, features) {
  if (!cache.has(battles))
    cache.set(battles, indexCountryEvents(battles, features));
  return cache.get(battles);
}
