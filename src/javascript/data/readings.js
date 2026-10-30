export function relativeLosses(losses, strength) {
  if (
    losses === null ||
    strength === null ||
    !Number.isFinite(losses) ||
    !Number.isFinite(strength) ||
    strength <= 0 ||
    losses < 0
  )
    return null;
  return (losses / strength) * 100;
}
export const formatPercent = (value) =>
  value === null
    ? "Sem dados"
    : `${value.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%`;
export function campaignGroups(battles) {
  const groups = new Map();
  for (const battle of battles) {
    const id = JSON.stringify([battle.campaign, battle.year]);
    if (!groups.has(id))
      groups.set(id, {
        id,
        name: battle.campaign,
        year: battle.year,
        events: [],
      });
    groups.get(id).events.push(battle);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      events: group.events
        .slice()
        .sort((a, b) => a.date - b.date || a.id.localeCompare(b.id)),
    }))
    .sort(
      (a, b) => a.events[0].date - b.events[0].date || a.id.localeCompare(b.id),
    );
}
export function recordMetrics(battle) {
  return [
    {
      id: "attackerStrength",
      label: "Efetivos · atacante",
      value: battle.attackerStrength,
      unit: "count",
    },
    {
      id: "defenderStrength",
      label: "Efetivos · defensor",
      value: battle.defenderStrength,
      unit: "count",
    },
    {
      id: "attackerLosses",
      label: "Baixas · atacante",
      value: battle.attackerLosses,
      unit: "count",
    },
    {
      id: "defenderLosses",
      label: "Baixas · defensor",
      value: battle.defenderLosses,
      unit: "count",
    },
    {
      id: "attackerRate",
      label: "Baixas / efetivos · atacante",
      value: relativeLosses(battle.attackerLosses, battle.attackerStrength),
      unit: "percent",
    },
    {
      id: "defenderRate",
      label: "Baixas / efetivos · defensor",
      value: relativeLosses(battle.defenderLosses, battle.defenderStrength),
      unit: "percent",
    },
  ];
}
export function coverageSummary(battles) {
  const years = new Map();
  for (const b of battles) years.set(b.year, (years.get(b.year) || 0) + 1);
  return {
    total: battles.length,
    campaigns: new Set(battles.map((b) => b.campaign)).size,
    years: [...years.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({
        year,
        count,
        percent: battles.length ? (count / battles.length) * 100 : 0,
      })),
    strengthPairs: battles.filter(
      (b) => b.attackerStrength !== null && b.defenderStrength !== null,
    ).length,
    casualtyPairs: battles.filter(
      (b) => b.attackerLosses !== null && b.defenderLosses !== null,
    ).length,
    relativePairs: battles.filter(
      (b) =>
        relativeLosses(b.attackerLosses, b.attackerStrength) !== null &&
        relativeLosses(b.defenderLosses, b.defenderStrength) !== null,
    ).length,
  };
}
export function comparisonInsight(a, b) {
  const first = relativeLosses(a.attackerLosses, a.attackerStrength),
    second = relativeLosses(b.attackerLosses, b.attackerStrength);
  if (first === null || second === null)
    return "Faltam valores para comparar a razão entre baixas e efetivos dos atacantes. Os valores conhecidos continuam disponíveis na tabela.";
  const difference = second - first;
  if (Math.abs(difference) < 0.05)
    return "Os dois registos têm razões entre baixas e efetivos do atacante semelhantes, à precisão apresentada.";
  return `No confronto B, a razão entre baixas e efetivos do atacante é ${Math.abs(difference).toLocaleString("pt-PT", { maximumFractionDigits: 1 })} pontos percentuais ${difference > 0 ? "superior" : "inferior"} à do confronto A.`;
}

export function suggestedComparison(battles) {
  const groups = campaignGroups(battles)
    .map((group) => ({
      ...group,
      events: group.events.filter(
        (b) =>
          relativeLosses(b.attackerLosses, b.attackerStrength) !== null &&
          relativeLosses(b.defenderLosses, b.defenderStrength) !== null,
      ),
    }))
    .filter((group) => group.events.length >= 2)
    .sort(
      (a, b) => b.events.length - a.events.length || a.id.localeCompare(b.id),
    );
  if (!groups.length) return null;
  const group = groups[0];
  return { group, first: group.events[0], second: group.events.at(-1) };
}
