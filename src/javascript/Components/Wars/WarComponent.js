import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExplorer } from "../../stores/useExplorer";
import { nearestWorldPosition } from "../../data/worldStream";
import { StyleShader } from "./StyleShader";
const dummy = new THREE.Object3D();
export function Wars({ clusters }) {
  const { nodes } = useGLTF(
    `${import.meta.env.BASE_URL}trees.glb`,
    `${import.meta.env.BASE_URL}draco/`,
  );
  const { nodes: distantNodes } = useGLTF(
    `${import.meta.env.BASE_URL}trees-lod.glb`,
  );
  const { nodes: mediumNodes } = useGLTF(
    `${import.meta.env.BASE_URL}trees-mid.glb`,
  );
  const mediumMesh = useRef();
  const instanceClusters = useRef({ far: [], medium: [] });
  const mesh = useRef();
  const closeMesh = useRef();
  const nearbyId = useExplorer((s) => s.nearbyId);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...StyleShader,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          colorMap: {
            value: ["#F00511", "#B4040C", "#780208", "#500105"].map((color) =>
              new THREE.Color(color).convertLinearToSRGB(),
            ),
          },
          brightnessThresholds: { value: [0.9, 0.45, 0.001] },
          lightPosition: { value: new THREE.Vector3(15, 60, 15) },
        },
      }),
    [],
  );
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const {
      telemetry: plane,
      expandedClusterId,
      cameraMode,
      viewDistance,
    } = useExplorer.getState();
    let farCount = 0,
      mediumCount = 0;
    instanceClusters.current.far.length = 0;
    instanceClusters.current.medium.length = 0;
    clusters.forEach((cluster, index) => {
      if (cluster.id === expandedClusterId) return;
      const [x, , z] =
        cameraMode === "flight"
          ? nearestWorldPosition([cluster.x, 0, cluster.z], plane)
          : [cluster.x, 0, cluster.z];
      const distance = Math.hypot(plane.x - x, plane.z - z);
      if (cameraMode === "flight" && distance > viewDistance) return;
      const active = cluster.id === nearbyId;
      const scale =
        cluster.scale * 1.28 *
        (active ? 1.15 + Math.sin(clock.elapsedTime * 0.6) * 0.04 : 1);
      dummy.position.set(x, scale * 2.4 + 1.7, z);
      dummy.rotation.set(0, clock.elapsedTime * 0.035 + index, 0);
      if (active) return;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      if (distance < 32) {
        mediumMesh.current.setMatrixAt(mediumCount++, dummy.matrix);
        instanceClusters.current.medium.push(cluster);
      } else {
        mesh.current.setMatrixAt(farCount++, dummy.matrix);
        instanceClusters.current.far.push(cluster);
      }
    });
    mesh.current.count = farCount;
    mediumMesh.current.count = mediumCount;
    mesh.current.instanceMatrix.needsUpdate = true;
    mediumMesh.current.instanceMatrix.needsUpdate = true;
    const nearby = clusters.find((c) => c.id === nearbyId);
    if (closeMesh.current) {
      closeMesh.current.visible = !!nearby && nearby.id !== expandedClusterId;
      if (nearby) {
        const scale =
          nearby.scale * 1.28 * (1.15 + Math.sin(clock.elapsedTime * 0.6) * 0.04);
        const [x, , z] =
          cameraMode === "flight"
            ? nearestWorldPosition([nearby.x, 0, nearby.z], plane)
            : [nearby.x, 0, nearby.z];
        closeMesh.current.position.set(x, scale * 2.4 + 1.7, z);
        closeMesh.current.scale.setScalar(scale);
        closeMesh.current.rotation.y =
          clock.elapsedTime * 0.035 + clusters.indexOf(nearby);
      }
    }
  });
  return (
    <>
      <instancedMesh
        ref={mesh}
        name="original-explosion-clusters"
        key={clusters.length}
        args={[distantNodes.Foliage.geometry, material, clusters.length]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          const c = instanceClusters.current.far[event.instanceId];
          if (c) useExplorer.getState().openCluster(c.id);
        }}
      />
      <instancedMesh
        ref={mediumMesh}
        name="original-explosion-medium"
        key={`mid-${clusters.length}`}
        args={[mediumNodes.Foliage.geometry, material, clusters.length]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          const c = instanceClusters.current.medium[event.instanceId];
          if (c) useExplorer.getState().openCluster(c.id);
        }}
      />
      <mesh
        ref={closeMesh}
        name="original-nearby-explosion"
        geometry={nodes.Foliage.geometry}
        material={material}
        onClick={(event) => {
          event.stopPropagation();
          if (nearbyId) useExplorer.getState().openCluster(nearbyId);
        }}
      />
    </>
  );
}
useGLTF.preload(
  `${import.meta.env.BASE_URL}trees.glb`,
  `${import.meta.env.BASE_URL}draco/`,
);
