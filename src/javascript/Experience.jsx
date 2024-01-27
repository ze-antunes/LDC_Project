import {
  Sky,
  Lightformer,
  Environment,
  OrbitControls
} from "@react-three/drei";
import { useControls, button } from "leva";
import { Perf } from "r3f-perf";
import Floor from "./World/Floor";

export default function Experience() {
  let test = () => {
    console.log("tick");
    console.log("tack");
  };

  let { position, color, visible, interval, clickMe } = useControls("Sphere", {
    position: {
      value: {
        x: -2,
        y: 0
      },
      step: 0.01,
      joystick: "invertY"
    },
    color: "#ff0000",
    visible: true,
    interval: {
      min: 0,
      max: 10,
      value: [3, 5]
    },
    clickMe: button(test),
    choice: { options: [1, 2, 3] }
  });

  let { scale } = useControls("Cube", {
    scale: {
      value: 1.5,
      step: 0.01,
      min: 0,
      max: 5
    }
  });

  let { perfVisible } = useControls("Perf", {
    perfVisible: false
  });

  return (
    <>
      {perfVisible ? <Perf position="top-left" /> : null}
      <OrbitControls makeDefault />

      <directionalLight position={[1, 2, 3]} intensity={4.5} />
      <ambientLight intensity={1.5} />

      <Environment background>
        <color args={["#000000"]} attach="background" />
        {/* <Lightformer position-z={-5} scale={10} />
        <mesh position-y={5} scale={10} rotation={[90, 0, 0]}>
          <planeGeometry />
          <meshBasicMaterial color={[10, 1, 0]} />
        </mesh> */}
      </Environment>

      <mesh position={[position.x, position.y, 0]} visible={visible}>
        <sphereGeometry />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh position-x={2} scale={scale}>
        <boxGeometry />
        <meshStandardMaterial color="mediumpurple" />
      </mesh>

      <Floor />
    </>
  );
}
