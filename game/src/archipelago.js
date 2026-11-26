export const ISLANDS = [
  { name: 'KORU CALDERA', x: 650, z: 2300, rx: 1350, rz: 1160, base: 185, peak: 690, tone: 'basalt' },
  { name: 'MANA REEF', x: -1000, z: 1380, rx: 1120, rz: 720, base: 72, peak: 205, tone: 'reef' },
  { name: 'ASH CAPE', x: 1580, z: 4400, rx: 920, rz: 1260, base: 190, peak: 510, tone: 'ash' },
  { name: 'TUI ATOLL', x: -1500, z: 4080, rx: 1200, rz: 900, base: 45, peak: 160, tone: 'reef' },
  { name: 'VESPER ISLE', x: 300, z: 6600, rx: 1480, rz: 1420, base: 160, peak: 570, tone: 'basalt' },
  { name: 'NORTH SPINE', x: -1800, z: 7200, rx: 1040, rz: 1450, base: 220, peak: 640, tone: 'ash' },
  { name: 'LANTERN KEY', x: 2050, z: 8200, rx: 1250, rz: 960, base: 58, peak: 180, tone: 'reef' },
];

export const RUNWAYS = [
  { name: 'KORU CLIFF', x: 0, z: 4400, length: 520, width: 92, elevation: 252, heading: 0 },
  { name: 'VESPER RIDGE', x: 270, z: 6900, length: 440, width: 82, elevation: 198, heading: 4 },
];

export function createArchipelago() {
  function heightAt(x, z) {
    let height = 0;
    for (const island of ISLANDS) {
      const dx = (x - island.x) / island.rx;
      const dz = (z - island.z) / island.rz;
      const radius = dx * dx + dz * dz;
      if (radius < 1) {
        const shelf = Math.pow(1 - radius, 0.56);
        const volcanicCone = island.tone === 'reef' ? 0 : Math.exp(-radius * 7.2) * island.peak * 0.48;
        height = Math.max(height, island.base + shelf * (island.peak - island.base) + volcanicCone);
      }
    }
    const strip = runwayAt(x, z);
    if (strip.inside) height = Math.max(height, strip.elevation);
    return height;
  }
  function runwayAt(x, z) {
    for (const runway of RUNWAYS) {
      const along = Math.abs(z - runway.z);
      const across = Math.abs(x - runway.x);
      if (along < runway.length * 0.58 && across < runway.width * 0.64) {
        return { inside: true, elevation: runway.elevation, heading: runway.heading, name: runway.name };
      }
    }
    return { inside: false, elevation: 0, heading: 0, name: '' };
  }
  function islandAt(x, z) {
    return ISLANDS.map(island => ({ island, d: Math.hypot((x - island.x) / island.rx, (z - island.z) / island.rz) }))
      .sort((a, b) => a.d - b.d)[0];
  }
  return { islands: ISLANDS, runways: RUNWAYS, heightAt, runwayAt, islandAt };
}
