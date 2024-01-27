import "./style/style.css";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import Experience from "./javascript/Experience.jsx";
import { StrictMode } from "react";
import { Leva } from "leva";
import Interface from "./javascript/Components/Interface";
import { KeyboardControls } from "@react-three/drei";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <StrictMode>
    <Leva collapsed />
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "left", keys: ["ArrowLeft", "KeyA"] },
        { name: "right", keys: ["ArrowRight", "KeyD"] }
      ]}
    >
      <Canvas
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [-4, 3, 6]
        }}
      >
        <Experience />
      </Canvas>
      <Interface />
    </KeyboardControls>
  </StrictMode>
);
