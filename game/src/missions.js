export const CONTRACTS = [
  { id: 'rescue', name: 'FLARE RESCUE', brief: 'Thread the storm. Drop a medical crate on the island flare.', color: '#ffbf69', reward: 1200 },
  { id: 'relay', name: 'REEF RELAY', brief: 'Tag three route rings, then deliver the signal core.', color: '#70edcf', reward: 900 },
  { id: 'runway', name: 'CLIFF DELIVERY', brief: 'Manage sink and speed for a short-strip landing.', color: '#ff806d', reward: 1500 },
];

export function createMissionDirector(contractId = 'rescue') {
  const contract = CONTRACTS.find(item => item.id === contractId) ?? CONTRACTS[0];
  return {
    contract, phase: 'briefing', score: 0, rings: 0, deliveries: 0, missed: 0,
    elapsed: 0, routeChoice: 'STORM CUT', event: 'CONTRACT READY', crate: null,
    beacon: { x: -95, z: 1880, radius: 230 },
    ring: { x: 160, z: 1020, radius: 150 },
    runway: { x: 0, z: 4400 },
    grade: '—', debrief: '',
  };
}

export function startMission(mission) {
  mission.phase = mission.contract.id === 'runway' ? 'approach' : 'outbound';
  mission.event = mission.contract.id === 'rescue' ? 'FLARE BEACON // DROP WINDOW OPEN' : 'DEPARTURE // ROUTE ACTIVE';
}

export function chooseRoute(mission, choice) {
  mission.routeChoice = choice;
  mission.event = choice === 'STORM CUT' ? 'SHORTCUT // SHEAR RISK + REWARD' : 'SAFE LOOP // FUEL RESERVE PROTECTED';
}

export function attemptDrop(mission, plane) {
  if (mission.contract.id !== 'rescue' || mission.crate || mission.phase === 'complete' || mission.phase === 'crashed') return { ok: false, message: 'NO ACTIVE DROP WINDOW' };
  const range = Math.hypot(plane.crossTrack - mission.beacon.x, plane.forward - mission.beacon.z);
  const aligned = range < 470 && plane.altitude > 250 && plane.altitude < 1650 && plane.airspeed < 154 && plane.hull > 0;
  if (!aligned) {
    mission.missed += 1;
    mission.score = Math.max(0, mission.score - 80);
    mission.event = 'DROP ABORT // ALIGN ON THE FLARE';
    return { ok: false, message: mission.event };
  }
  mission.crate = { timer: 1.55, range, scored: false };
  mission.event = 'SUPPLY CHUTE AWAY';
  return { ok: true, message: mission.event };
}

export function updateMission(mission, plane, dt, flightEvent = null) {
  if (mission.phase === 'briefing' || mission.phase === 'complete' || mission.phase === 'crashed') return null;
  mission.elapsed += dt;
  if (mission.contract.id === 'relay' && mission.rings < 3) {
    const p = mission.ring;
    const range = Math.hypot(plane.crossTrack - p.x, plane.forward - p.z);
    if (range < p.radius && plane.altitude > 300) {
      mission.rings += 1;
      mission.score += 220;
      mission.event = `RING ${mission.rings}/3 // ROUTE MARKED`;
      p.z += 1380;
      p.x = [-210, 150, 0][mission.rings % 3];
    }
  }
  if (mission.crate && !mission.crate.scored) {
    mission.crate.timer -= dt;
    if (mission.crate.timer <= 0) {
      mission.crate.scored = true;
      const landingError = Math.hypot(plane.crossTrack - mission.beacon.x, plane.forward - mission.beacon.z);
      if (landingError < mission.beacon.radius * 1.55) {
        mission.deliveries += 1;
        mission.score += mission.contract.reward;
        mission.event = 'RESCUE CONFIRMED // CREW SAFE';
        mission.phase = 'approach';
      } else {
        mission.missed += 1;
        mission.event = 'CRATE DRIFT // RESCUE MISSED';
      }
    }
  }
  if (flightEvent === 'touchdown') {
    mission.phase = 'complete';
    mission.score += Math.max(0, Math.round(360 - Math.abs(plane.verticalSpeed) * 42 - Math.abs(plane.roll) * 320));
    mission.grade = mission.score >= 1300 ? 'S' : mission.score >= 850 ? 'A' : mission.score >= 450 ? 'B' : mission.score >= 180 ? 'C' : 'D';
    mission.debrief = `KORU CLIFF // TOUCHDOWN ${Math.round(plane.airspeed)} KT // ${mission.deliveries} DELIVERY // ${Math.round(plane.fuel)}% FUEL`;
    mission.event = 'WHEELS DOWN // CONTRACT COMPLETE';
    return 'complete';
  }
  if (flightEvent === 'crash' || flightEvent === 'hull' || flightEvent === 'fuel') {
    mission.phase = 'crashed';
    mission.grade = 'D';
    mission.debrief = `AIRFRAME LOST // ${String(flightEvent).toUpperCase()} // ${mission.score} PTS`;
    mission.event = 'MAYDAY // SORTIE TERMINATED';
    return 'crash';
  }
  return null;
}
