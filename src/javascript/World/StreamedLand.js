import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import manifest from "../../../public/world/manifest.json";
import { useExplorer } from "../stores/useExplorer";
import { CHUNK_SIZE, chunkSlots } from "../data/worldStream";
import { FLIGHT_BOUNDS as B } from "../data/geography";
const landMaterial = new THREE.MeshStandardMaterial({
  color: "#555555",
  roughness: 0.85,
});
function LandChunk({ slot, tile }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}${tile.url}`);
  const geometry = useMemo(() => {
    let result;
    scene.traverse((object) => {
      if (object.isMesh && !result) result = object.geometry;
    });
    return result;
  }, [scene]);
  return (
    <mesh
      name={`land-chunk-${slot.id}`}
      userData={{ mapSurface: "land" }}
      geometry={geometry}
      material={landMaterial}
      position={[slot.x, 0, slot.z]}
      dispose={null}
    />
  );
}
export default function StreamedLand() {
  const anchor = useExplorer(
    (s) =>
      `${Math.floor((s.telemetry.x - B.minX) / CHUNK_SIZE)}:${Math.floor((s.telemetry.z - B.minZ) / CHUNK_SIZE)}`,
  );
  const distance = useExplorer((s) => s.viewDistance);
  const ocean = useRef();
  const slots = useMemo(() => {
    const { telemetry } = useExplorer.getState();
    return chunkSlots(telemetry.x, telemetry.z, distance).filter(
      (slot) => manifest.tiles[slot.id],
    );
  }, [anchor, distance]);
  useEffect(() => {
    const { telemetry } = useExplorer.getState();
    for (const slot of chunkSlots(
      telemetry.x,
      telemetry.z,
      distance + CHUNK_SIZE,
    )) {
      const tile = manifest.tiles[slot.id];
      if (tile) useGLTF.preload(`${import.meta.env.BASE_URL}${tile.url}`);
    }
  }, [anchor, distance]);
  useFrame(() => {
    if (!ocean.current) return;
    const p = useExplorer.getState().telemetry;
    ocean.current.position.set(p.x, -0.2, p.z);
  });
  return (
    <group name="streamed-world">
      <mesh ref={ocean} userData={{ mapSurface: "water" }} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[distance * 6, distance * 6]} />
        <meshBasicMaterial color="#1c1c1c" />
      </mesh>
      {slots.map((slot) => (
        <Suspense key={slot.key} fallback={null}>
          <LandChunk slot={slot} tile={manifest.tiles[slot.id]} />
        </Suspense>
      ))}
    </group>
  );
}
