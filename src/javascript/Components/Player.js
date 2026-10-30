import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF, Html, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Box3, Vector3, MathUtils } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { useExplorer } from "../stores/useExplorer";
import { AIRCRAFT } from "../data/aircraft";
import { mapPosition, filterBattles } from "../data/battles";
import { clusterBattles, nearbyCluster } from "../data/clusters";
import { nearestWorldPosition, cameraRebase } from "../data/worldStream";
import SmokeTrail from "./SmokeTrail";
import { preparePropellers, spinPropellers } from "../data/propellers";
import { stepFlight } from "../data/flight";

class ModelBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useExplorer.getState().setModelStatus("error");
  }
  render() {
    return this.state.failed ? (
      <Html center>
        <span className="map-label">
          Modelo indisponível. Escolhe outro avião.
        </span>
      </Html>
    ) : (
      this.props.children
    );
  }
}
function Aircraft({ aircraft }) {
  const { scene } = useGLTF(
    `${import.meta.env.BASE_URL}Airplanes/${aircraft.id}/scene.gltf`,
  );
  const object = useMemo(() => {
    const model = clone(scene);
    model.rotation.set(...aircraft.rotation);
    model.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = 2.2 / Math.max(size.x, size.y, size.z);
    model.scale.multiplyScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    return preparePropellers(model, aircraft.id);
  }, [scene, aircraft]);
  useEffect(() => {
    useExplorer.getState().setModelStatus("ready");
  }, [aircraft]);
  useFrame((_, dt) => {
    const state=useExplorer.getState();
    if(!state.paused && state.cameraMode === "flight") spinPropellers(object.rotors,dt,state.telemetry.speed);
  });
  useEffect(()=>()=>object.dispose(),[object]);
  return <primitive object={object.group} dispose={null} />;
}
export default function Player() {
  const plane = useRef();
  const [, getKeys] = useKeyboardControls();
  const aircraftId = useExplorer((s) => s.aircraft);
  const reset = useExplorer((s) => s.flightReset);
  const cameraMode = useExplorer((s) => s.cameraMode);
  const battles = useExplorer((s) => s.battles);
  const year = useExplorer((s) => s.year),
    theatre = useExplorer((s) => s.theatre),
    query = useExplorer((s) => s.query);
  const clusters = useMemo(
    () => clusterBattles(filterBattles(battles, { year, theatre, query })),
    [battles, year, theatre, query],
  );
  const flight = useRef({
    x: 0,
    y: 6,
    z: 0,
    heading: 0,
    pitch: 0,
    bank: 0,
    speed: 4.0,
    paused: false,
  });
  const cameraPosition = useMemo(() => new Vector3(), []);
  const cameraTarget = useMemo(() => new Vector3(), []);
  const selectionAge = useRef(0),
    lastSelected = useRef(null),
    cameraReady = useRef(false);
  const timer = useRef(0),
    initialized = useRef(false),
    lastTravel = useRef(-1),
    arrivedVersion = useRef(-1),
    dwell = useRef(0);
  useEffect(() => {
    cameraReady.current = false;
  }, [cameraMode]);
  const input = useMemo(() => ({}), []);
  const aircraft = AIRCRAFT.find((a) => a.id === aircraftId) || AIRCRAFT[0];
  useEffect(() => {
    if (!battles.length) return;
    const selected =
      battles.find((b) => b.id === useExplorer.getState().selectedId) ||
      battles[0];
    const [eventX, , eventZ] = mapPosition(selected);
    const initialCluster = !initialized.current
      ? clusters.find((c) => c.events.some((b) => b.id === selected.id))
      : null;
    const x = initialCluster?.x ?? eventX,
      z = initialCluster?.z ?? eventZ;
    Object.assign(flight.current, {
      x,
      y: 6,
      z: z + (initialCluster ? 1 : 5),
      heading: 0,
      pitch: 0,
      bank: 0,
      speed: 4.0,
      maneuver: null,
      cameraHeading: undefined,
    });
    initialized.current = true;
    cameraReady.current = false;
    useExplorer.getState().setProximity(null);
  }, [battles, reset]);
  useFrame((state, frameDelta) => {
    if (!plane.current || !initialized.current) return;
    const dt = Math.min(frameDelta, 0.05);
    const current = useExplorer.getState();
    const f = flight.current;
    const typing = document.activeElement?.matches("input, select, textarea");
    const keys = typing || current.drawer ? {} : getKeys();
    for (const key of [
      "forward",
      "backward",
      "left",
      "right",
      "rudderLeft",
      "rudderRight",
      "accelerate",
      "decelerate",
    ])
      input[key] = keys[key] || current.pressed[key];
    const manual =
      input.forward ||
      input.backward ||
      input.left ||
      input.right ||
      input.rudderLeft ||
      input.rudderRight;
    let destination = current.battles.find(
      (b) => b.id === current.destinationId,
    );
    if (manual && destination) {
      current.cancelRoute();
      destination = null;
    }
    if (current.travelVersion !== lastTravel.current) {
      lastTravel.current = current.travelVersion;
      arrivedVersion.current = -1;
      dwell.current = 0;
    }
    f.paused = current.paused || current.cameraMode !== "flight";
    const target = destination
      ? nearestWorldPosition(mapPosition(destination), f)
      : null;
    if (
      target &&
      arrivedVersion.current !== current.travelVersion &&
      Math.hypot(f.x - target[0], f.z - target[2]) < 3.5
    ) {
      current.arrived();
      arrivedVersion.current = current.travelVersion;
      f.paused = true;
    }
    if (
      current.playing &&
      arrivedVersion.current === current.travelVersion &&
      current.cameraMode === "flight" &&
      !current.drawer
    ) {
      dwell.current += dt;
      const progress = Math.min(1, dwell.current / current.readingSeconds);
      if (Math.floor(progress * 100) !== Math.floor(current.eventProgress * 100))
        current.setEventProgress(progress);
      if (dwell.current >= current.readingSeconds) current.advanceTour();
    }
    const previous = { x: f.x, z: f.z };
    stepFlight(f, input, dt, target);
    const [rebaseX, rebaseZ] = cameraRebase(previous, f);
    if (rebaseX || rebaseZ) {
      state.camera.position.x += rebaseX;
      state.camera.position.z += rebaseZ;
      current.updateTelemetry({
        x: f.x,
        y: f.y,
        z: f.z,
        heading: f.heading,
        speed: f.speed,
      });
    }
    selectionAge.current += dt;
    if (lastSelected.current !== current.selectedId) {
      lastSelected.current = current.selectedId;
      selectionAge.current = 0;
    }
    plane.current.position.set(f.x, f.y, f.z);
    plane.current.rotation.set(f.pitch, f.heading, f.bank, "YXZ");
    if (current.cameraMode === "flight") {
      const chaseHeading = f.cameraHeading ?? f.heading;
      cameraPosition.set(
        f.x + Math.sin(chaseHeading) * 9,
        f.y + 6.0,
        f.z + Math.cos(chaseHeading) * 9,
      );
      cameraTarget.set(
        f.x - Math.sin(chaseHeading) * 3,
        f.y - 1.3,
        f.z - Math.cos(chaseHeading) * 3,
      );
      if (!cameraReady.current) {
        state.camera.position.copy(cameraPosition);
        cameraReady.current = true;
      } else state.camera.position.lerp(cameraPosition, 1 - Math.exp(-2 * dt));
      state.camera.lookAt(cameraTarget);
    }
    timer.current += dt;
    if (timer.current > 0.15) {
      timer.current = 0;
      const nearby = nearbyCluster(clusters, f.x, f.z, current.nearbyId);
      if ((nearby?.id ?? null) !== current.nearbyId)
        current.setProximity(nearby);
      if (nearby && !f.paused && !destination && !current.drawer) {
        let closest = null,
          distance = Infinity;
        for (const event of nearby.events) {
          const [x, , z] = nearestWorldPosition(mapPosition(event), f);
          const d = Math.hypot(f.x - x, f.z - z);
          if (d < distance) {
            closest = event;
            distance = d;
          }
        }
        const selected = nearby.events.find((b) => b.id === current.selectedId);
        const selectedPosition = selected
          ? nearestWorldPosition(mapPosition(selected), f)
          : null;
        const selectedDistance = selectedPosition
          ? Math.hypot(f.x - selectedPosition[0], f.z - selectedPosition[2])
          : Infinity;
        if (
          closest &&
          closest.id !== current.selectedId &&
          selectedDistance > distance + 0.75 &&
          selectionAge.current >= 6
        )
          current.reactToEvent(closest.id);
      }
      current.updateTelemetry({
        x: f.x,
        y: f.y,
        z: f.z,
        heading: f.heading,
        speed: f.speed,
      });
    }
  });
  return (
    <>
    <group ref={plane} name="player-aircraft">
      <ModelBoundary key={aircraft.id}>
        <Suspense fallback={null}>
          <Aircraft aircraft={aircraft} />
        </Suspense>
      </ModelBoundary>
    </group>
    <SmokeTrail plane={plane} flight={flight} aircraftId={aircraftId} reset={reset} />
    </>
  );
}
