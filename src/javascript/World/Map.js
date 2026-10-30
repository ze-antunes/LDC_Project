import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useExplorer } from "../stores/useExplorer";
import { filterBattles } from "../data/battles";
import { clusterBattles } from "../data/clusters";
import { MAP_SCALE, ORIGINAL_ORIGIN } from "../data/geography";
import { Wars } from "../Components/Wars/WarComponent";
import Countries from "./Countries";
import CountryPicking from "./CountryPicking";
import StreamedLand from "./StreamedLand";
import { worldCopies } from "../data/worldStream";
import EventPoints from "../Components/Wars/EventPoints";
function OriginalMap() {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}map-original.glb`);
  useMemo(() => scene.traverse((object) => {
    if (object.isMesh) object.userData.mapSurface = "land";
  }), [scene]);
  return (
    <primitive
      object={scene}
      position={[
        -ORIGINAL_ORIGIN[0] * MAP_SCALE,
        -0.15,
        -ORIGINAL_ORIGIN[1] * MAP_SCALE,
      ]}
      scale={[MAP_SCALE, 40, MAP_SCALE]}
      dispose={null}
    />
  );
}
export default function Map() {
  const battles = useExplorer((s) => s.battles),
    year = useExplorer((s) => s.year);
  const theatre = useExplorer((s) => s.theatre),
    query = useExplorer((s) => s.query);
  const mode = useExplorer((s) => s.cameraMode);
  const copies = useMemo(
    () => (mode === "flight" ? worldCopies() : [[0, 0, 0]]),
    [mode],
  );
  const expandedId = useExplorer((s) => s.expandedClusterId);
  const visible = useMemo(
    () => filterBattles(battles, { year, theatre, query }),
    [battles, year, theatre, query],
  );
  const clusters = useMemo(
    () => clusterBattles(filterBattles(battles, { year, theatre, query })),
    [battles, year, theatre, query],
  );
  return (
    <>
      {mode === "flight" ? (
        <StreamedLand />
      ) : (
        <>
          <mesh userData={{ mapSurface: "water" }} rotation={[-Math.PI / 2, 0, 0]} position-y={-0.2}>
            <planeGeometry args={[1080, 504]} />
            <meshBasicMaterial color="#1c1c1c" />
          </mesh>
          <Suspense fallback={null}>
            <OriginalMap />
          </Suspense>
        </>
      )}
      <CountryPicking />
      {copies.map((offset) => (
        <Countries key={offset.join(":")} offset={offset} />
      ))}
      <EventPoints
        battles={visible}
        expanded={clusters.find((c) => c.id === expandedId)}
      />
      <Suspense fallback={null}>
        <Wars clusters={clusters} />
      </Suspense>
    </>
  );
}
