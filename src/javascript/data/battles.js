import { geographicPosition } from "./geography.js";
import { csvParse } from "d3";

export const THEATRES = {
  europe: { label: "Europa", color: "#83d5c5" },
  africa: { label: "Norte de África", color: "#e8b86d" },
  pacific: { label: "Ásia e Pacífico", color: "#ed8e82" },
};
export function numberOrNull(value) {
  if (
    value == null ||
    String(value).trim() === "" ||
    String(value).trim() === "NA"
  )
    return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
export function fractionalDate(value) {
  const year = Math.floor(value);
  const start = Date.UTC(year, 0, 1);
  return new Date(start + (value - year) * (Date.UTC(year + 1, 0, 1) - start));
}
export function parseBattles(text) {
  return csvParse(text)
    .map((row, index) => {
      const date = numberOrNull(row.date);
      const longitude = row.long?.trim() ? Number(row.long) : NaN;
      const latitude = row.lat?.trim() ? Number(row.lat) : NaN;
      if (
        date === null ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        Math.abs(longitude) > 180 ||
        Math.abs(latitude) > 90
      )
        return null;
      const attackerLosses = numberOrNull(row.acas_per);
      const defenderLosses = numberOrNull(row.dcas_per);
      const theatre = /AFRICA/.test(row.war)
        ? "africa"
        : /PACIFIC|OKINAWA/.test(row.war) || longitude > 95
          ? "pacific"
          : "europe";
      return {
        id: `${row.iseq || index}-${index}`,
        name: row.engagem,
        campaign: row.campn,
        war: row.war,
        date,
        year: Math.floor(date),
        dateObject: fractionalDate(date),
        longitude,
        latitude,
        theatre,
        attacker: row.atkr,
        defender: row.defr,
        attackerCommander: row.atk_cmdr,
        defenderCommander: row.def_cmdr,
        attackerStrength: numberOrNull(row.amilpert),
        defenderStrength: numberOrNull(row.dmilpert),
        attackerLosses,
        defenderLosses,
        duration: numberOrNull(row.duration),
        losses:
          attackerLosses !== null && defenderLosses !== null
            ? attackerLosses + defenderLosses
            : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date || a.id.localeCompare(b.id));
}
export function filterBattles(
  battles,
  { year = "all", theatre = "all", query = "" },
) {
  const search = query.trim().toLocaleLowerCase();
  return battles.filter(
    (b) =>
      (year === "all" || b.year === Number(year)) &&
      (theatre === "all" || b.theatre === theatre) &&
      (!search ||
        `${b.name} ${b.campaign} ${b.attacker} ${b.defender}`
          .toLocaleLowerCase()
          .includes(search)),
  );
}
export const mapPosition = (battle) =>
  geographicPosition(battle.longitude, battle.latitude);
export const formatNumber = (value) =>
  value === null
    ? "Sem dados"
    : new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(
        value,
      );
export const formatDate = (battle) =>
  battle.dateObject.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
