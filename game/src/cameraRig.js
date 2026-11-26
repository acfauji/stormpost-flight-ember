export function createCameraRig() {
  return { roll: 0, pitch: 0, horizonY: 0.39, shake: 0, zoom: 1 };
}

export function updateCamera(camera, plane, weather, dt) {
  const smoothing = Math.min(1, dt * 2.8);
  camera.roll += (plane.roll * 0.42 - camera.roll) * smoothing;
  camera.pitch += (plane.pitch * 0.72 - camera.pitch) * smoothing;
  camera.shake += ((weather.turbulence ?? 0) * 1.6 - camera.shake) * Math.min(1, dt * 5);
  camera.zoom = 1 + Math.max(0, plane.airspeed - 120) * 0.0007;
  return camera;
}

export function cameraOffset(camera, time) {
  return { x: Math.sin(time * 28) * camera.shake, y: Math.cos(time * 23) * camera.shake * 0.6 };
}
