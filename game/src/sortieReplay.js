import { createFlightModel, stepFlight, clamp } from './flightPhysics.js';
import { createWeather, sampleWeather } from './weather.js';

// Reproducible flight checkpoints, not painted telemetry. Every fuel and hull
// value starts at 100 and is advanced by the same physics used during play.
// The replay flies the approach leg from an offshore departure, with an
// altitude/heading hold pilot. Checkpoints remain fully playable afterwards.
export function replaySortie(terrain, checkpoint = 'cover') {
  const plane = createFlightModel({ forward: -6000, crossTrack: -420, heading: 0, airspeed: 105, pitch: .025, throttle: .223 });
  const weather = createWeather(73);
  const stop = { cover: 0, storm: 1580, runway: 3750, debrief: 4250 }[checkpoint] ?? 0;
  let seconds = 0;
  let steps = 0;
  let holdStarted = false;
  let holdDegrees = 0;
  let holding = false;
  while ((plane.forward < stop || holding) && !plane.crashed && !plane.touchdown && steps < 20000) {
    const dt = .04;
    sampleWeather(weather, plane, dt);
    if (!holdStarted && stop > 1400 && plane.forward >= 1400) { holding = true; holdStarted = true; }
    const targetCross = plane.forward > 2100 && !holding ? 0 : -420;
    const targetHeading = clamp((targetCross - plane.crossTrack) * .07 - weather.crosswind * 1.1, -24, 24);
    const headingError = ((targetHeading - plane.heading + 540) % 360) - 180;
    if (!holding && holdStarted && plane.forward > 2200) { plane.flaps = .78; plane.gearDown = true; }
    const targetAltitude = holding || plane.forward < 1800 ? 1120 : Math.max(270, 1120 - (plane.forward - 1800) * .5);
    const sink = clamp((targetAltitude - plane.altitude) * .2, -18, 5);
    const desiredPitch = clamp((sink - plane.verticalSpeed) * .035 + .025, -.35, .35);
    const previousHeading = plane.heading;
    stepFlight(plane, {
      roll: holding ? 1 : clamp(headingError * .11, -1, 1),
      pitch: clamp((desiredPitch - plane.pitch) * 5, -1, 1),
      throttle: clamp(((plane.gearDown ? 80 : 105) - plane.airspeed) * .05, -1, 1),
    }, { ...weather, routeEfficiency: .88, severity: weather.severity * 1.12 }, terrain, dt);
    if (holding) {
      holdDegrees += ((plane.heading - previousHeading + 540) % 360) - 180;
      if (holdDegrees >= 720) holding = false;
    }
    seconds += dt;
    steps++;
  }
  return { plane, weather, seconds, steps };
}
