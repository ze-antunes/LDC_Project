import { useFrame } from "@react-three/fiber";
import { nearestWorldPosition } from "../../data/worldStream";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mapPosition } from "../../data/battles";
import { useExplorer } from "../../stores/useExplorer";
const pointGeometry = new THREE.CylinderGeometry(0.085, 0.085, 0.035, 12);
const pointMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff" });
const spreadMaterial = new THREE.MeshBasicMaterial({ color: "#ff333b" });
const dummy = new THREE.Object3D();
export function expandedPointPositions(cluster) {
  return cluster.events.map((battle, i) => {
    const ring = Math.floor(i / 18),
      count = Math.min(18, cluster.count - ring * 18),
      angle = ((i % 18) / count) * Math.PI * 2;
    const radius = 1.3 + ring * 0.9;
    return {
      battle,
      position: [
        cluster.x + Math.cos(angle) * radius,
        0.7 + ring * 0.08,
        cluster.z + Math.sin(angle) * radius,
      ],
      anchor: mapPosition(battle),
    };
  });
}
export default function EventPoints({ battles, expanded }) {
  const points = useRef(),
    spread = useRef(),
    expandedGroup = useRef(),
    drawn = useRef([]);
  const positions = useMemo(
    () => battles.map((battle) => ({ battle, position: mapPosition(battle) })),
    [battles],
  );
  const layout = useMemo(
    () => (expanded ? expandedPointPositions(expanded) : []),
    [expanded],
  );
  const stems = useMemo(() => {
    const values = [];
    for (const { position: p, anchor: a } of layout)
      values.push(a[0], 0.2, a[2], p[0], p[1], p[2]);
    return new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(values, 3),
    );
  }, [layout]);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    if (!points.current) return;
    const state = useExplorer.getState(),
      flight = state.cameraMode === "flight",
      compare = state.drawer === "event" && state.readingTab === "compare";
    let count = 0;
    drawn.current.length = 0;
    for (const { battle, position } of positions) {
      const [x, , z] = flight
        ? nearestWorldPosition(position, state.telemetry)
        : position;
      if (
        flight &&
        Math.hypot(x - state.telemetry.x, z - state.telemetry.z) >
          state.viewDistance
      )
        continue;
      const second = compare && battle.id === state.comparisonId;
      dummy.position.set(x, 0.23, z);
      dummy.scale.setScalar(battle.id === state.selectedId || second ? 1.8 : 1);
      dummy.updateMatrix();
      points.current.setMatrixAt(count, dummy.matrix);
      points.current.setColorAt(
        count,
        color.set(second ? "#eeeeee" : "#f00511"),
      );
      count++;
      drawn.current.push(battle);
    }
    points.current.count = count;
    points.current.instanceMatrix.needsUpdate = true;
    if (points.current.instanceColor)
      points.current.instanceColor.needsUpdate = true;
    if (expandedGroup.current && expanded) {
      const [x, , z] = flight
        ? nearestWorldPosition([expanded.x, 0, expanded.z], state.telemetry)
        : [expanded.x, 0, expanded.z];
      expandedGroup.current.position.set(x - expanded.x, 0, z - expanded.z);
    }
    if (spread.current) {
      layout.forEach(({ position }, index) => {
        dummy.position.set(...position);
        dummy.scale.setScalar(1.5);
        dummy.updateMatrix();
        spread.current.setMatrixAt(index, dummy.matrix);
      });
      spread.current.instanceMatrix.needsUpdate = true;
    }
  });
  const inspect = (battle) => {
    if (!battle) return;
    const s = useExplorer.getState();
    s.select(battle.id);
    s.openDrawer("event");
  };
  return (
    <>
      <instancedMesh
        ref={points}
        name="geographic-event-points"
        key={`points-${battles.length}`}
        args={[pointGeometry, pointMaterial, battles.length]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          inspect(drawn.current[event.instanceId]);
        }}
      />
      {expanded && (
        <group ref={expandedGroup}>
          <lineSegments geometry={stems}>
            <lineBasicMaterial color="#f00511" transparent opacity={0.45} />
          </lineSegments>
          <instancedMesh
            ref={spread}
            name="expanded-cluster-points"
            key={expanded.id}
            args={[pointGeometry, spreadMaterial, layout.length]}
            frustumCulled={false}
            onClick={(event) => {
              event.stopPropagation();
              inspect(layout[event.instanceId]?.battle);
            }}
          />
        </group>
      )}
    </>
  );
}
