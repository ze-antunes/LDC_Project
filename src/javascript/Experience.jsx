import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import Map from "./World/Map";
import Player from "./Components/Player";
import { useExplorer } from "./stores/useExplorer";
export default function Experience() {
  const mode = useExplorer((s) => s.cameraMode),
    distance = useExplorer((s) => s.viewDistance);
  const camera = useThree((s) => s.camera),
    controls = useRef();
  useEffect(() => {
    camera.clearViewOffset();
    if (mode === "overview") {
      const t = useExplorer.getState().telemetry;
      camera.position.set(t.x, 160, t.z + 96);
      camera.lookAt(t.x, 0, t.z);
      if (controls.current) {
        controls.current.target.set(t.x, 0, t.z);
        controls.current.update();
      }
    }
  }, [mode, camera]);
  return (
    <>
      <color
        attach="background"
        args={[mode === "flight" ? "#1c1c1c" : "#000000"]}
      />
      {mode === "flight" && (
        <fog attach="fog" args={["#1c1c1c", distance * 0.35, distance]} />
      )}
      <ambientLight intensity={1.8} />
      <directionalLight position={[35, 60, 25]} intensity={2.4} />
      {mode === "overview" && (
        <OrbitControls
          ref={controls}
          makeDefault
          minDistance={8}
          maxDistance={825}
          maxPolarAngle={Math.PI / 2.1}
        />
      )}
      <Map />
      <Player />
    </>
  );
}
