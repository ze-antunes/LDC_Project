import { geoNaturalEarth1, geoContains } from "d3";
// Natural Earth projection fitted to the original country GLBs.
export const MAP_SCALE = 1800;
export const ORIGINAL_ORIGIN = [0.2783519206060342, 0.1415958808192479];
export const PROJECTION_SCALE = [
  0.10548000418119421 * MAP_SCALE,
  0.10267447772687639 * MAP_SCALE,
];
const projection = geoNaturalEarth1().scale(1).translate([0, 0]);
export function geographicPosition(longitude, latitude) {
  const [x, z] = projection([longitude, latitude]);
  return [x * PROJECTION_SCALE[0], 0, z * PROJECTION_SCALE[1]];
}
export const FLIGHT_BOUNDS = {
  minX: -495,
  maxX: 513,
  minZ: -252,
  maxZ: 180,
  minY: 2.5,
  maxY: 15,
};

// Reject polar SVG triangulation artefacts and points outside the projection.
export function countryContainsMapPoint(feature, x, z) {
  const projected = [x / PROJECTION_SCALE[0], z / PROJECTION_SCALE[1]];
  const coordinate = projection.invert(projected);
  const roundTrip = coordinate && projection(coordinate);
  if (!roundTrip || Math.hypot(roundTrip[0] - projected[0], roundTrip[1] - projected[1]) > 1e-5)
    return false;
  return geoContains(feature, coordinate);
}
