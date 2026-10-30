import { useMemo } from "react";
import * as THREE from "three";
import { geoPath, geoNaturalEarth1 } from "d3";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { world } from "../data/world";
import { geographicPosition, PROJECTION_SCALE } from "../data/geography";
import { useExplorer } from "../stores/useExplorer";
let cachedGeometry;
function buildCountries() {
  if (cachedGeometry) return cachedGeometry;
  const path = geoPath(geoNaturalEarth1().scale(1).translate([0, 0]));
  const borders = [],
    geometries = new Map(),
    outlines = new Map();
  for (const feature of world.features) {
    const svg = new SVGLoader().parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${path(feature)}" /></svg>`,
    );
    const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
    if (!shapes.length) continue;
    let geometry = new THREE.ShapeGeometry(shapes)
      .rotateX(Math.PI / 2)
      .scale(PROJECTION_SCALE[0], 1, PROJECTION_SCALE[1])
      .translate(0, 0.14, 0);
    if (geometry.index) geometry = geometry.toNonIndexed();
    geometries.set(String(feature.id), geometry);
    const lines = [];
    const polygons =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    for (const polygon of polygons)
      for (const ring of polygon)
        for (let i = 1; i < ring.length; i++) {
          const a = geographicPosition(...ring[i - 1]),
            b = geographicPosition(...ring[i]);
          if (Math.hypot(a[0] - b[0], a[2] - b[2]) > 90) continue;
          lines.push(a[0], 0.16, a[2], b[0], 0.16, b[2]);
        }
    borders.push(...lines);
    outlines.set(
      String(feature.id),
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(lines, 3),
      ),
    );
  }
  return (cachedGeometry = {
    geometries,
    outlines,
    borders: new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(borders, 3),
    ),
  });
}
export default function Countries({ offset = [0, 0, 0] }) {
  const data = useMemo(buildCountries, []);
  const selectedId = useExplorer((s) => s.selectedCountryId),
    hoveredId = useExplorer((s) => s.hoveredCountryId);
  return (
    <group position={offset} dispose={null}>
      <lineSegments geometry={data.borders} name="country-outlines">
        <lineBasicMaterial color="#252525" transparent opacity={0.9} />
      </lineSegments>
      {[...new Set([hoveredId, selectedId].filter(Boolean))].map(
        (id) =>
          data.geometries.has(id) && (
            <group key={id}>
              <mesh geometry={data.geometries.get(id)} position-y={0.01}>
                <meshBasicMaterial
                  color={id === selectedId ? "#c8000c" : "#fff"}
                  transparent
                  opacity={0.08}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments geometry={data.outlines.get(id)} position-y={0.02}>
                <lineBasicMaterial
                  color={id === selectedId ? "#e22" : "#ddd"}
                />
              </lineSegments>
            </group>
          ),
      )}
    </group>
  );
}
