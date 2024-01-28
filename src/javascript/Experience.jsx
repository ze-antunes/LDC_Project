import {
  Sky,
  Lightformer,
  Environment,
  OrbitControls
} from "@react-three/drei";
import { useControls, button } from "leva";
import { Perf } from "r3f-perf";
import { Physics } from "@react-three/rapier";
import Lights from "./World/Lights";
import Floor from "./World/Floor";
import { Level } from "./Components/Level";
import Player from "./Components/Player";
import useGame from "./stores/useGame";
import Map from "./World/Map";

export default function Experience() {
  let blocksCount = useGame((state) => {
    return state.blocksCount;
  });
  let blockSeed = useGame((state) => {
    return state.blockSeed;
  });

  // let test = () => {
  //   console.log("tick");
  //   console.log("tack");
  // };

  // let { position, color, visible, interval, clickMe } = useControls("Sphere", {
  //   position: {
  //     value: {
  //       x: -2,
  //       y: 0
  //     },
  //     step: 0.01,
  //     joystick: "invertY"
  //   },
  //   color: "#ff0000",
  //   visible: true,
  //   interval: {
  //     min: 0,
  //     max: 10,
  //     value: [3, 5]
  //   },
  //   clickMe: button(test),
  //   choice: { options: [1, 2, 3] }
  // });

  // let { scale } = useControls("Cube", {
  //   scale: {
  //     value: 1.5,
  //     step: 0.01,
  //     min: 0,
  //     max: 5
  //   }
  // });

  let { perfVisible } = useControls("Perf", {
    perfVisible: false
  });

  return (
    <>
      {perfVisible ? <Perf position="top-left" /> : null}
      <OrbitControls makeDefault />
      <color args={["#000000"]} attach="background" />

      <Physics debug={false}>
        <Lights />
        {/* <mesh
          castShadow
          position={[position.x, position.y, 0]}
          visible={visible}
        >
          <sphereGeometry />
          <meshStandardMaterial color={color} />
        </mesh>

        <mesh position-x={2} scale={scale}>
          <boxGeometry />
          <meshStandardMaterial color="mediumpurple" />
        </mesh> */}

        <Level count={blocksCount} seed={blockSeed} />
        <Player />
        <Floor />
        <Map />
      </Physics>
    </>
  );
}
