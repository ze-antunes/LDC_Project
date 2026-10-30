import { FLIGHT_BOUNDS as B } from "./geography.js";
export const CHUNK_SIZE = 36;
export const WORLD_WIDTH = B.maxX - B.minX;
export const WORLD_DEPTH = B.maxZ - B.minZ;
export const CHUNK_COLUMNS = Math.round(WORLD_WIDTH / CHUNK_SIZE);
export const CHUNK_ROWS = Math.round(WORLD_DEPTH / CHUNK_SIZE);
export const wrapCoordinate = (value, min, max) =>
  ((((value - min) % (max - min)) + (max - min)) % (max - min)) + min;
export function nearestWorldPosition(position, origin) {
  return [
    position[0] +
      Math.round((origin.x - position[0]) / WORLD_WIDTH) * WORLD_WIDTH,
    position[1] || 0,
    position[2] +
      Math.round((origin.z - position[2]) / WORLD_DEPTH) * WORLD_DEPTH,
  ];
}
export function worldDistance(x, z, otherX, otherZ) {
  const dx = wrapCoordinate(otherX - x, -WORLD_WIDTH / 2, WORLD_WIDTH / 2),
    dz = wrapCoordinate(otherZ - z, -WORLD_DEPTH / 2, WORLD_DEPTH / 2);
  return Math.hypot(dx, dz);
}
export function cameraRebase(before, after) {
  return [
    Math.round((after.x - before.x) / WORLD_WIDTH) * WORLD_WIDTH,
    Math.round((after.z - before.z) / WORLD_DEPTH) * WORLD_DEPTH,
  ];
}
export function chunkSlots(x, z, distance) {
  const cx = Math.floor((x - B.minX) / CHUNK_SIZE),
    cz = Math.floor((z - B.minZ) / CHUNK_SIZE),
    radius = Math.ceil(distance / CHUNK_SIZE) + 1;
  const slots = [];
  for (let dx = -radius; dx <= radius; dx++)
    for (let dz = -radius; dz <= radius; dz++) {
      const col = cx + dx,
        row = cz + dz,
        px = B.minX + col * CHUNK_SIZE,
        pz = B.minZ + row * CHUNK_SIZE;
      const closestX = Math.max(px, Math.min(px + CHUNK_SIZE, x)),
        closestZ = Math.max(pz, Math.min(pz + CHUNK_SIZE, z));
      if (Math.hypot(closestX - x, closestZ - z) > distance + CHUNK_SIZE)
        continue;
      const canonicalCol =
          ((col % CHUNK_COLUMNS) + CHUNK_COLUMNS) % CHUNK_COLUMNS,
        canonicalRow = ((row % CHUNK_ROWS) + CHUNK_ROWS) % CHUNK_ROWS;
      slots.push({
        key: `${col}:${row}`,
        id: `${canonicalCol}-${canonicalRow}`,
        x: px,
        z: pz,
      });
    }
  return slots;
}
export function worldCopies() {
  const copies = [];
  for (const x of [-WORLD_WIDTH, 0, WORLD_WIDTH])
    for (const z of [-WORLD_DEPTH, 0, WORLD_DEPTH]) copies.push([x, 0, z]);
  return copies;
}
