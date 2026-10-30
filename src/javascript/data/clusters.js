import { worldDistance } from "./worldStream.js";
import { mapPosition } from "./battles.js";
export const CLUSTER_RADIUS = 3.2;
export const ENTER_RADIUS = 8;
export const EXIT_RADIUS = 11;
export function clusterBattles(battles, radius = CLUSTER_RADIUS) {
  const points = battles
    .map((battle) => ({ battle, position: mapPosition(battle) }))
    .sort(
      (a, b) =>
        a.position[0] - b.position[0] ||
        a.position[2] - b.position[2] ||
        a.battle.id.localeCompare(b.battle.id),
    );
  const clusters = [];
  for (const {
    battle,
    position: [x, , z],
  } of points) {
    let best = null,
      distance = Infinity;
    for (const candidate of clusters) {
      const d = Math.hypot(candidate.x - x, candidate.z - z);
      if (
        d <= radius &&
        d < distance &&
        candidate.points.every(
          (p) => Math.hypot(p[0] - x, p[1] - z) <= radius * 2,
        )
      ) {
        best = candidate;
        distance = d;
      }
    }
    if (!best) {
      best = { x, z, events: [], points: [] };
      clusters.push(best);
    }
    best.events.push(battle);
    best.points.push([x, z]);
    const n = best.events.length;
    best.x += (x - best.x) / n;
    best.z += (z - best.z) / n;
  }
  return clusters.map((cluster) => {
    cluster.events.sort((a, b) => a.date - b.date || a.id.localeCompare(b.id));
    return {
      id: cluster.events
        .map((b) => b.id)
        .sort()
        .join("|"),
      x: cluster.x,
      z: cluster.z,
      events: cluster.events,
      count: cluster.events.length,
      scale: 0.22 * Math.cbrt(cluster.events.length),
      name: [...new Set(cluster.events.map((b) => b.campaign))]
        .slice(0, 2)
        .join(" / "),
    };
  });
}
export function nearbyCluster(clusters, x, z, previousId = null) {
  const previous = clusters.find((c) => c.id === previousId);
  if (previous && worldDistance(previous.x, previous.z, x, z) <= EXIT_RADIUS)
    return previous;
  let nearest = null,
    distance = ENTER_RADIUS;
  for (const cluster of clusters) {
    const d = worldDistance(cluster.x, cluster.z, x, z);
    if (d < distance) {
      nearest = cluster;
      distance = d;
    }
  }
  return nearest;
}
