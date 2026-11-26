import { createArchipelago } from './archipelago.js';
import { createCameraRig, updateCamera } from './cameraRig.js';
import { createFlightModel, stepFlight } from './flightPhysics.js';
import { attemptDrop, chooseRoute, CONTRACTS, createMissionDirector, startMission, updateMission } from './missions.js';
import { createRenderer } from './renderer.js';
import { createSoundEngine } from './audio.js';
import { createWeather, sampleWeather } from './weather.js';
import { replaySortie } from './sortieReplay.js';

const canvas = document.getElementById('flight-view');
const status = document.getElementById('flight-status');
const query = new URLSearchParams(location.search);
const variant = query.get('variant') === 'teal' ? 'teal' : 'ember';
const terrain = createArchipelago();
const weather = createWeather(73);
const camera = createCameraRig();
const audio = createSoundEngine();
const renderer = createRenderer(canvas);
const keys = new Set();
let mouse = { down: false, x: 0, y: 0, inside: false };
let chosen = query.get('contract') || 'rescue';
let plane = createFlightModel();
let mission = createMissionDirector(chosen);
let screen = 'title';
let elapsed = 0;
let previousTime = performance.now();
let sceneName = query.get('scene');

function announce(message) {
  if (status && status.textContent !== message) status.textContent = message;
}

function resetFlight() {
  plane = createFlightModel();
  mission = createMissionDirector(chosen);
  Object.assign(weather, createWeather(73));
  elapsed = 0;
  return plane;
}

function selectContract(id) {
  if (!CONTRACTS.some(item => item.id === id)) return;
  chosen = id;
  mission = createMissionDirector(id);
  if (screen === 'play') startMission(mission);
  announce(`${mission.contract.name}. ${mission.contract.brief}`);
}

function stageScene(name, launch = true) {
  resetFlight();
  const scenarios = {
    cover: { forward: 260, crossTrack: 0, altitude: 1120, airspeed: 122, heading: 8, pitch: .065, roll: .14, throttle: .79 },
    storm: { forward: 1680, crossTrack: -220, altitude: 920, airspeed: 106, heading: 5, pitch: .08, roll: -.1, throttle: .68 },
    runway: { forward: 4070, crossTrack: 0, altitude: 264, verticalSpeed: -1.7, airspeed: 84, heading: 0, pitch: -.01, roll: 0, throttle: .52, flaps: .78, gearDown: true },
    debrief: { forward: 5000, altitude: 268, airspeed: 64, heading: 0, throttle: .28, fuel: 63, hull: 91 },
    crash: { forward: 4380, altitude: 255, verticalSpeed: -8.1, airspeed: 36, heading: 48, throttle: .2, gearDown: false },
  };
  if (!scenarios[name]) return false;
  Object.assign(plane, scenarios[name]);
  if (['cover', 'storm', 'runway'].includes(name)) {
    const replay = replaySortie(terrain, name);
    plane = replay.plane;
    Object.assign(weather, replay.weather);
    elapsed = replay.seconds;
    if (name === 'runway') { plane.gearDown = true; plane.flaps = .78; }
  }
  if (name === 'storm') {
    mission = createMissionDirector('rescue');
    mission.phase = 'outbound';
    mission.event = 'FLARE BEACON // DROP WINDOW OPEN';
  } else if (name === 'runway') {
    selectContract('runway'); mission.phase = 'approach'; mission.event = 'FINAL // CLIFF STRIP IN SIGHT';
  } else if (name === 'debrief') {
    selectContract('rescue'); mission.phase = 'complete'; mission.score = 1540; mission.rings = 2; mission.deliveries = 1;
    mission.grade = 'S'; mission.debrief = 'KORU CLIFF // 71 KT // 1 DELIVERY // 63% FUEL'; mission.event = 'WHEELS DOWN // CONTRACT COMPLETE'; screen = 'debrief';
  } else if (name === 'crash') {
    selectContract('rescue'); mission.phase = 'crashed'; mission.score = 340; mission.grade = 'D';
    mission.debrief = 'AIRFRAME LOST // UNSTABLE APPROACH'; mission.event = 'MAYDAY // SORTIE TERMINATED';
    plane.crashed = true; screen = 'crash';
  } else {
    mission = createMissionDirector(chosen); mission.phase = 'outbound';
    if (launch) screen = 'play';
  }
  if (launch && name !== 'debrief' && name !== 'crash') {
    screen = 'play'; startMission(mission); audio.start();
    if (name === 'runway') mission.event = 'FINAL // CLIFF STRIP IN SIGHT';
  }
  announce(mission.event);
  return true;
}

function launch() {
  if (screen === 'debrief' || screen === 'crash') resetFlight();
  screen = 'play'; startMission(mission); audio.start();
  previousTime = performance.now();
  announce(`${mission.contract.name} // FLIGHT ACTIVE`);
}

function restart() {
  resetFlight(); screen = 'play'; startMission(mission); audio.start();
  announce(`${mission.contract.name} // NEW SORTIE`);
}

function toggleRoute() {
  chooseRoute(mission, mission.routeChoice === 'STORM CUT' ? 'SAFE LOOP' : 'STORM CUT');
  audio.cue(mission.routeChoice === 'STORM CUT' ? 520 : 350, .09);
}

function dropSupply() {
  if (screen !== 'play') return;
  const result = attemptDrop(mission, plane);
  audio.cue(result.ok ? 720 : 230, result.ok ? .22 : .16, result.ok ? 'sine' : 'square');
  announce(result.message);
}

function controlsForFrame() {
  const down = (...codes) => codes.some(code => keys.has(code));
  let roll = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
  let pitch = (down('KeyW', 'ArrowUp') ? 1 : 0) - (down('KeyS', 'ArrowDown') ? 1 : 0);
  let yaw = (down('KeyE') ? 1 : 0) - (down('KeyQ') ? 1 : 0);
  if (mouse.down && mouse.inside) {
    const rect = canvas.getBoundingClientRect();
    roll = Math.max(-1, Math.min(1, (mouse.x - rect.left - rect.width * .5) / (rect.width * .4)));
    pitch = Math.max(-1, Math.min(1, (rect.height * .52 - (mouse.y - rect.top)) / (rect.height * .37)));
  }
  return { roll, pitch, yaw, throttle: (down('ShiftLeft', 'ShiftRight') ? 1 : 0) - (down('ControlLeft', 'ControlRight') ? 1 : 0), flaps: 0 };
}

function onKeyDown(event) {
  const code = event.code;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) event.preventDefault();
  if (event.repeat) { keys.add(code); return; }
  keys.add(code);
  if (screen === 'title') {
    if (code === 'Digit1') selectContract('rescue');
    if (code === 'Digit2') selectContract('relay');
    if (code === 'Digit3') selectContract('runway');
    if (code === 'Enter' || code === 'Space') launch();
    return;
  }
  if ((screen === 'debrief' || screen === 'crash') && ['Digit1', 'Digit2', 'Digit3'].includes(code)) {
    selectContract(({ Digit1: 'rescue', Digit2: 'relay', Digit3: 'runway' })[code]);
    restart();
    return;
  }
  if ((screen === 'debrief' || screen === 'crash') && code === 'Enter') { restart(); return; }
  if (code === 'KeyP') { screen = screen === 'paused' ? 'play' : screen === 'play' ? 'paused' : screen; return; }
  if (screen !== 'play') return;
  if (code === 'Space') dropSupply();
  if (code === 'KeyV') toggleRoute();
  if (code === 'KeyF') { plane.flaps = plane.flaps < .4 ? .72 : .12; audio.cue(290, .07); }
  if (code === 'KeyG') { plane.gearDown = !plane.gearDown; audio.cue(plane.gearDown ? 330 : 540, .12); announce(plane.gearDown ? 'GEAR DOWN' : 'GEAR UP'); }
  if (code === 'KeyM') { announce(audio.toggle() ? 'RADIO AUDIO ON' : 'RADIO AUDIO MUTED'); }
}

function onKeyUp(event) { keys.delete(event.code); }
function onPointerDown(event) {
  if (screen === 'title') { launch(); return; }
  if (event.button === 2) { event.preventDefault(); dropSupply(); return; }
  mouse.down = true; mouse.x = event.clientX; mouse.y = event.clientY; mouse.inside = true;
  canvas.setPointerCapture?.(event.pointerId);
}
function onPointerMove(event) { mouse.x = event.clientX; mouse.y = event.clientY; mouse.inside = true; }
function onPointerUp() { mouse.down = false; }

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);
canvas.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', () => { keys.clear(); mouse.down = false; if (screen === 'play') screen = 'paused'; });

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.045, Math.max(0, (now - previousTime) / 1000));
  previousTime = now; elapsed += dt;
  if (screen === 'play') {
    sampleWeather(weather, plane, dt);
    const safe = mission.routeChoice === 'SAFE LOOP';
    const routeWeather = {
      ...weather,
      crosswind: weather.crosswind * (safe ? .56 : 1.35),
      turbulence: weather.turbulence * (safe ? .52 : 1.25),
      severity: weather.severity * (safe ? .62 : 1.12),
      routeEfficiency: safe ? 1.45 : .88,
    };
    const result = stepFlight(plane, controlsForFrame(), routeWeather, terrain, dt);
    const end = updateMission(mission, plane, dt, result.event);
    if (end === 'complete') { screen = 'debrief'; audio.cue(820, .32, 'sine'); announce(mission.event); }
    else if (end === 'crash') { screen = 'crash'; audio.cue(92, .7, 'sawtooth'); announce(mission.event); }
    else if (result.event === 'touchdown') { screen = 'debrief'; audio.cue(820, .32, 'sine'); announce(mission.event); }
    else if (result.event === 'crash' || result.event === 'hull' || result.event === 'fuel') { screen = 'crash'; announce(mission.event); }
    audio.engine(plane.throttle, weather.severity);
  } else if (screen === 'title' || screen === 'paused') {
    sampleWeather(weather, plane, dt * .25);
  }
  updateCamera(camera, plane, weather, dt);
  const game = { plane, mission, weather, terrain, camera, variant, screen, time: elapsed };
  renderer.draw(game);
}

function stateSnapshot() {
  return {
    screen, contract: mission.contract.id, phase: mission.phase, score: mission.score,
    rings: mission.rings, deliveries: mission.deliveries, missed: mission.missed,
    altitude: Math.round(plane.altitude), speed: Math.round(plane.airspeed), heading: Math.round(plane.heading),
    throttle: Number(plane.throttle.toFixed(2)), flaps: Number(plane.flaps.toFixed(2)),
    fuel: Math.round(plane.fuel), hull: Math.round(plane.hull), roll: Number(plane.roll.toFixed(3)),
    forward: Math.round(plane.forward), crossTrack: Math.round(plane.crossTrack),
    event: mission.event, grade: mission.grade, route: mission.routeChoice, variant,
    flightSeconds: Number(elapsed.toFixed(2)),
  };
}

window.stormpost = Object.freeze({
  state: stateSnapshot,
  start: launch,
  restart,
  selectContract,
  scenario: name => stageScene(name, true),
});

if (sceneName) stageScene(sceneName, true);
else announce('STORMPOST. Press Enter to launch the rescue flight.');
requestAnimationFrame(frame);
