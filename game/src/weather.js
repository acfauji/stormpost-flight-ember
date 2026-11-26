const STORM_CELLS = [
  { x: -420, z: 1950, radius: 1120, power: 0.94, name: 'STORM CORRIDOR' },
  { x: 1550, z: 5050, radius: 970, power: 0.7, name: 'ASH SHEAR' },
  { x: -1550, z: 7050, radius: 1050, power: 0.52, name: 'NORTH SQUALL' },
];

export function createWeather(seed = 41) {
  return { time: 0, seed, lightning: 0, alert: 'CALM AIR', severity: 0, crosswind: 0, turbulence: 0, updraft: 0, rain: 0, cells: STORM_CELLS };
}

export function sampleWeather(weather, plane, dt) {
  weather.time += dt;
  let severity = 0;
  let active = null;
  for (const cell of weather.cells) {
    const dx = plane.crossTrack - cell.x;
    const dz = plane.forward - cell.z;
    const distance = Math.hypot(dx, dz);
    const intensity = Math.max(0, 1 - distance / cell.radius) * cell.power;
    if (intensity > severity) { severity = intensity; active = cell; }
  }
  const wave = Math.sin(weather.time * 2.1 + weather.seed) + Math.sin(weather.time * 3.7) * 0.4;
  weather.severity = severity;
  weather.crosswind = Math.sin(weather.time * 0.63) * 6 + severity * wave * 19;
  weather.turbulence = severity * (0.4 + Math.abs(wave) * 1.3);
  weather.updraft = Math.max(0, Math.sin((plane.forward - 2250) / 410)) * Math.max(0, 1 - Math.abs(plane.crossTrack - 650) / 820) * 2.9;
  weather.rain = severity;
  weather.alert = severity > 0.55 ? `${active?.name ?? 'SQUALL'} // SHEAR ${Math.round(weather.crosswind)} KT` : severity > 0.2 ? 'GUST FRONT AHEAD' : 'CALM AIR';
  const flashCycle = (weather.time * (0.65 + severity * 1.2)) % 8;
  weather.lightning = severity > 0.3 && flashCycle < 0.2 ? (0.2 - flashCycle) * 5 : 0;
  return weather;
}

export function radarCells(weather) {
  return weather.cells.map(cell => ({ ...cell, x: cell.x / 2200, z: cell.z / 6500 }));
}
