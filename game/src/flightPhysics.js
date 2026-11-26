export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const radians = degrees => degrees * Math.PI / 180;
export const degrees = radiansValue => radiansValue * 180 / Math.PI;

export function createFlightModel(overrides = {}) {
  return {
    x: 0, forward: 0, altitude: 980, verticalSpeed: 0, airspeed: 112,
    heading: 6, pitch: 0.105, roll: 0, yaw: 0, throttle: 0.72,
    flaps: 0.25, gearDown: false, fuel: 100, hull: 100,
    stall: false, gLoad: 1, crossTrack: 0, distance: 0,
    ground: 0, touchdown: false, crashed: false, score: 0,
    ...overrides,
  };
}

export function flightEnvelope(plane) {
  const liftRatio = clamp((plane.airspeed - 38) / 78, 0, 1.25);
  const stall = plane.airspeed < 48 + (plane.flaps < 0.2 ? 10 : 0);
  return { liftRatio, stall, safeSpeed: 48 + (plane.flaps < 0.2 ? 10 : 0) };
}

export function stepFlight(plane, controls, weather, terrain, dt) {
  if (plane.crashed || plane.touchdown) return { event: null, envelope: flightEnvelope(plane) };
  const s = Math.min(dt, 0.04);
  const input = controls ?? {};
  plane.throttle = clamp(plane.throttle + (input.throttle ?? 0) * s * 0.34, 0.08, 1);
  plane.flaps = clamp(plane.flaps + (input.flaps ?? 0) * s * 0.85, 0, 1);
  plane.gearDown = input.gearToggle ? !plane.gearDown : plane.gearDown;
  const commandedRoll = clamp(input.roll ?? 0, -1, 1) * 0.52;
  plane.roll += (commandedRoll - plane.roll) * Math.min(1, s * 2.4);
  const pitchCommand = clamp(input.pitch ?? 0, -1, 1);
  plane.pitch = clamp(plane.pitch + pitchCommand * s * 0.36, -0.42, 0.42);
  plane.yaw += ((input.yaw ?? 0) * 0.75 - plane.yaw) * Math.min(1, s * 2.1);

  const flapDrag = plane.flaps * 0.31 + (plane.gearDown ? 0.11 : 0);
  const drag = 0.11 + flapDrag + Math.max(0, plane.airspeed - 160) * 0.002;
  const thrust = plane.throttle * 0.92;
  plane.airspeed = clamp(plane.airspeed + (thrust - drag) * s * 11, 24, 220);
  const bankTurn = Math.sin(plane.roll) * (plane.airspeed / 105) * 21;
  plane.heading = (plane.heading + (bankTurn + plane.yaw * 26 + (weather.crosswind ?? 0) * 0.018) * s + 360) % 360;
  const radiansHeading = radians(plane.heading);
  const distance = plane.airspeed * 0.5144 * s;
  plane.forward += distance * Math.cos(radiansHeading);
  plane.crossTrack += distance * Math.sin(radiansHeading) + (weather.crosswind ?? 0) * s;
  plane.distance += distance;

  const envelope = flightEnvelope(plane);
  const lift = envelope.liftRatio * envelope.liftRatio * (plane.pitch * 15.5 + plane.flaps * 3.7);
  const stallPenalty = envelope.stall ? 4.6 : 0;
  const verticalAcceleration = lift - 1.45 - stallPenalty + (weather.updraft ?? 0) - (weather.turbulence ?? 0) * 0.22;
  plane.verticalSpeed = clamp(plane.verticalSpeed + verticalAcceleration * s, -24, 18);
  plane.altitude = Math.max(0, plane.altitude + plane.verticalSpeed * s);
  plane.ground = terrain.heightAt(plane.crossTrack, plane.forward);
  plane.stall = envelope.stall;
  plane.gLoad = clamp(1 + Math.abs(plane.roll) * plane.airspeed / 98, 0.2, 3.8);
  plane.fuel = Math.max(0, plane.fuel - (0.035 + plane.throttle * 0.075 + flapDrag * 0.012) * s * 2.4 * (weather.routeEfficiency ?? 1));
  if (weather.severity > 0.55) plane.hull = Math.max(0, plane.hull - weather.severity * s * 0.5);
  if (plane.fuel <= 0) plane.throttle = Math.min(plane.throttle, 0.18);

  let event = null;
  if (plane.altitude <= plane.ground + 4) {
    const runway = terrain.runwayAt(plane.crossTrack, plane.forward);
    const aligned = Math.abs(plane.roll) < 0.17 && Math.abs(plane.heading - runway.heading) < 18;
    const safeSink = plane.verticalSpeed > -4.2;
    const safeSpeed = plane.airspeed >= 58 && plane.airspeed <= 128;
    if (runway.inside && plane.gearDown && aligned && safeSink && safeSpeed) {
      plane.touchdown = true;
      plane.altitude = plane.ground + 2;
      plane.verticalSpeed = 0;
      event = 'touchdown';
    } else {
      plane.crashed = true;
      plane.altitude = plane.ground;
      plane.hull = 0;
      event = 'crash';
    }
  }
  if (plane.hull <= 0 && !plane.crashed) { plane.crashed = true; event = 'hull'; }
  if (plane.fuel <= 0 && plane.altitude < plane.ground + 10) { plane.crashed = true; event = 'fuel'; }
  return { event, envelope };
}
