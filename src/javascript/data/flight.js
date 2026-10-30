import { wrapCoordinate } from "./worldStream.js";
import { FLIGHT_BOUNDS as B } from "./geography.js";
const RECOVERY_ALTITUDE = 13;
const RECOVERY_DURATION = 4;
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
export const angleDifference = (target, current) =>
  Math.atan2(Math.sin(target - current), Math.cos(target - current));
export function stepFlight(flight, input, frameDelta, destination = null) {
  const dt = Math.min(frameDelta, 0.05);
  if (flight.paused) return flight;
  if (flight.maneuver) {
    recoverFromCeiling(flight, dt);
    return flight;
  }
  const turn = Number(!!input.right) - Number(!!input.left);
  const rudder = Number(!!input.rudderRight) - Number(!!input.rudderLeft);
  const pitchInput = Number(!!input.backward) - Number(!!input.forward);
  flight.speed = clamp(
    flight.speed +
      (Number(!!input.accelerate) - Number(!!input.decelerate)) * dt * 1.5,
    1,
    8,
  );
  if (destination) {
    const dx = destination[0] - flight.x,
      dz = destination[2] - flight.z;
    const targetHeading = Math.atan2(-dx, -dz);
    const correction = angleDifference(targetHeading, flight.heading);
    flight.speed = damp(
      flight.speed,
      clamp(Math.hypot(dx, dz) * 0.3, 1.5, 6),
      1.2,
      dt,
    );
    flight.heading += clamp(correction, -1.2 * dt, 1.2 * dt);
    flight.bank = damp(flight.bank, clamp(correction * 0.8, -0.6, 0.6), 3, dt);
    flight.pitch = damp(
      flight.pitch,
      clamp((6 - flight.y) * 0.08, -0.25, 0.25),
      3,
      dt,
    );
  } else {
    flight.bank = damp(flight.bank, -turn * 0.65, 4, dt);
    flight.heading += (Math.sin(flight.bank) * 0.9 - rudder * 0.45) * dt;
    flight.pitch = damp(flight.pitch, pitchInput * 0.45, 3, dt);
  }
  const horizontalSpeed = flight.speed * Math.cos(flight.pitch);
  flight.x += -Math.sin(flight.heading) * horizontalSpeed * dt;
  flight.z += -Math.cos(flight.heading) * horizontalSpeed * dt;
  flight.y = clamp(
    flight.y + Math.sin(flight.pitch) * flight.speed * dt,
    B.minY,
    B.maxY,
  );
  if (flight.y >= B.maxY && flight.pitch > 0) {
    flight.maneuver = { phase: "loop", elapsed: 0, entryPitch: flight.pitch, entryBank: flight.bank, entryHeading: flight.heading, exitPitch: Math.asin(Math.min(Math.sin(0.45), 2 * (B.maxY - RECOVERY_ALTITUDE) / (RECOVERY_DURATION * flight.speed))) };
  }
  flight.x = wrapCoordinate(flight.x, B.minX, B.maxX);
  flight.z = wrapCoordinate(flight.z, B.minZ, B.maxZ);
  return flight;
}

// Half a backward loop plus a half roll reverses direction (an Immelmann).
// Inputs resume only after a smooth recovery to the requested altitude.
function recoverFromCeiling(f, dt) {
  const m = f.maneuver;
  m.elapsed += dt;
  f.bank = damp(f.bank, 0, 4, dt);
  if (m.phase === "loop") {
    const t = Math.min(1, m.elapsed / 4.5);
    const ease = t * t * (3 - 2 * t);
    f.pitch = m.entryPitch + (Math.PI + m.exitPitch - m.entryPitch) * ease;
    const rollT = clamp((t - 0.45) / 0.55, 0, 1);
    const rollEase = rollT * rollT * (3 - 2 * rollT);
    f.bank = m.entryBank * (1 - rollEase) + Math.PI * rollEase;
    // The chase camera moves around smoothly while the aircraft pitches over.
    f.cameraHeading = m.entryHeading + Math.PI * ease;
    f.y = B.maxY - (B.maxY - RECOVERY_ALTITUDE) * Math.sin(Math.PI * t) ** 2;
    if (t === 1) {
      m.phase = "descent";
      m.elapsed = 0;
      m.entryVelocity = -Math.sin(m.exitPitch) * f.speed;
      // Equivalent Euler pose: preserve the visible orientation while switching
      // to upright flight in precisely the opposite heading.
      f.heading = m.entryHeading + Math.PI;
      f.pitch = -m.exitPitch;
      f.bank = 0;
      delete f.cameraHeading;
    }
  } else {
    const duration = RECOVERY_DURATION;
    const t = Math.min(1, m.elapsed / duration);
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    f.y = h00 * B.maxY + h10 * duration * m.entryVelocity + h01 * RECOVERY_ALTITUDE;
    const velocity = ((6 * t * t - 6 * t) * B.maxY +
      (3 * t * t - 4 * t + 1) * duration * m.entryVelocity +
      (-6 * t * t + 6 * t) * RECOVERY_ALTITUDE) / duration;
    f.pitch = Math.asin(clamp(velocity / f.speed, -0.95, 0));
    if (t === 1) { f.y = RECOVERY_ALTITUDE; f.pitch = 0; f.maneuver = null; }
  }
  const horizontal = f.speed * Math.cos(f.pitch) * dt;
  f.x = wrapCoordinate(f.x - Math.sin(f.heading) * horizontal, B.minX, B.maxX);
  f.z = wrapCoordinate(f.z - Math.cos(f.heading) * horizontal, B.minZ, B.maxZ);
}
