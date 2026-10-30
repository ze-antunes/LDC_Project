import "./style/style.css";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import Experience from "./javascript/Experience.jsx";
import { StrictMode } from "react";

import Interface from "./javascript/Components/Interface";
import { KeyboardControls } from "@react-three/drei";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <StrictMode>
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "left", keys: ["ArrowLeft", "KeyA"] },
        { name: "right", keys: ["ArrowRight", "KeyD"] },
        { name: "rudderLeft", keys: ["KeyQ"] },
        { name: "rudderRight", keys: ["KeyE"] },
        { name: "accelerate", keys: ["ShiftLeft", "ShiftRight"] },
        { name: "decelerate", keys: ["ControlLeft", "ControlRight"] },
      ]}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 1400,
          position: [0, 12, 20],
        }}
      >
        <Experience />
      </Canvas>
      <Interface />
    </KeyboardControls>
  </StrictMode>,
);
