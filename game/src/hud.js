const SKINS = {
  teal: { ink: '#071722', panel: 'rgba(4,18,27,.82)', edge: 'rgba(119,211,199,.55)', glow: '#75e6d0', warm: '#ffc36d', text: '#e8f2e9', muted: '#9db7b8', danger: '#ff796d' },
  ember: { ink: '#1d1115', panel: 'rgba(22,10,16,.84)', edge: 'rgba(255,145,99,.58)', glow: '#ff9b68', warm: '#ffe2a0', text: '#fff0d9', muted: '#c6a9a2', danger: '#ff5965' },
};

function plate(ctx, x, y, w, h, skin, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = skin.panel; ctx.strokeStyle = skin.edge; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke(); ctx.restore();
}

function label(ctx, text, x, y, skin, size = 11, color = skin.muted, align = 'left') {
  ctx.font = `600 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y);
}

function meter(ctx, x, y, w, value, color) {
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, value)), 5);
}

function drawHorizon(ctx, cx, cy, radius, plane, skin) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-plane.roll * 0.6);
  ctx.fillStyle = 'rgba(48,121,143,.28)'; ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(198,119,70,.23)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = skin.glow; ctx.lineWidth = 1.4;
  for (let step = -3; step <= 3; step++) {
    const yy = step * 13 + plane.pitch * 45;
    if (Math.abs(yy) < radius - 4) {
      ctx.beginPath(); ctx.moveTo(-16 - Math.abs(step) * 2, yy); ctx.lineTo(16 + Math.abs(step) * 2, yy); ctx.stroke();
    }
  }
  ctx.restore();
  ctx.strokeStyle = skin.glow; ctx.lineWidth = 1.6; ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 24, cy); ctx.lineTo(cx - 8, cy); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy + 4); ctx.lineTo(cx + 8, cy); ctx.lineTo(cx + 24, cy); ctx.stroke();
  label(ctx, 'ATT', cx, cy + radius + 15, skin, 9, skin.glow, 'center');
}

function drawTape(ctx, x, y, value, title, unit, skin, right = false) {
  const w = 86; const h = 138; const xx = right ? x - w : x;
  plate(ctx, xx, y, w, h, skin, 0.95);
  label(ctx, title, xx + w / 2, y + 18, skin, 9, skin.glow, 'center');
  label(ctx, String(Math.round(value)).padStart(3, '0'), xx + w / 2, y + 65, skin, 28, skin.text, 'center');
  label(ctx, unit, xx + w / 2, y + 83, skin, 9, skin.muted, 'center');
  const cx = right ? xx + 9 : xx + w - 9;
  ctx.strokeStyle = skin.warm; ctx.lineWidth = 2; ctx.beginPath();
  if (right) { ctx.moveTo(cx, y + 58); ctx.lineTo(cx + 10, y + 64); ctx.lineTo(cx, y + 70); }
  else { ctx.moveTo(cx, y + 58); ctx.lineTo(cx - 10, y + 64); ctx.lineTo(cx, y + 70); }
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const yy = y + 101 + i * 8;
    ctx.strokeStyle = 'rgba(220,242,232,.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xx + 18, yy); ctx.lineTo(xx + w - 18, yy); ctx.stroke();
  }
}

function drawRadar(ctx, x, y, skin, plane, weather, mission) {
  const r = 47;
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(5,19,28,.92)'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.strokeStyle = 'rgba(139,218,202,.3)'; ctx.lineWidth = 1;
  for (const q of [0.32, 0.65, 1]) { ctx.beginPath(); ctx.arc(x, y, r * q, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  for (const cell of weather.cells) {
    const dx = (cell.x - plane.crossTrack) / 25; const dz = (cell.z - plane.forward) / 35;
    const px = x + Math.max(-r + 6, Math.min(r - 6, dx)); const py = y - Math.max(-r + 6, Math.min(r - 6, dz));
    ctx.fillStyle = 'rgba(255,100,81,.7)'; ctx.beginPath(); ctx.arc(px, py, 4 + cell.power * 3, 0, 7); ctx.fill();
  }
  const tx = x + Math.max(-r + 5, Math.min(r - 5, (mission.beacon.x - plane.crossTrack) / 25));
  const ty = y - Math.max(-r + 5, Math.min(r - 5, (mission.beacon.z - plane.forward) / 35));
  ctx.fillStyle = skin.warm; ctx.shadowColor = skin.warm; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(tx, ty, 3.5, 0, 7); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x + 5, y + 5); ctx.closePath(); ctx.fill();
  ctx.restore(); ctx.strokeStyle = skin.edge; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
}

export function drawCockpitHud(ctx, game) {
  const { plane, mission, weather, variant, width, height } = game;
  const skin = SKINS[variant] ?? SKINS.teal;
  const margin = Math.max(22, width * 0.025);
  label(ctx, 'ISLEWATCH  /  RESCUE FLIGHT', margin, 29, skin, 11, skin.glow);
  label(ctx, 'SECTOR 07  //  ARCHIPELAGO', margin, 47, skin, 9, skin.muted);
  label(ctx, `CONTRACT  ${mission.contract.name}`, width / 2, 29, skin, 11, skin.text, 'center');
  label(ctx, `LEG ${mission.phase.toUpperCase()}  ·  ${mission.routeChoice}`, width / 2, 48, skin, 9, skin.glow, 'center');
  label(ctx, `${weather.alert}`, width - margin, 29, skin, 10, weather.severity > 0.45 ? skin.danger : skin.warm, 'right');
  label(ctx, `WIND ${weather.crosswind >= 0 ? '+' : ''}${weather.crosswind.toFixed(0)} KT`, width - margin, 47, skin, 9, skin.muted, 'right');
  const tapeY = height * 0.22;
  drawTape(ctx, margin, tapeY, plane.airspeed, 'IAS', 'KNOTS', skin, false);
  drawTape(ctx, width - margin, tapeY, plane.altitude, 'ALT', 'METERS', skin, true);
  const heading = Math.round(plane.heading);
  plate(ctx, width / 2 - 112, tapeY + 1, 224, 38, skin, 0.9);
  label(ctx, 'HDG', width / 2 - 92, tapeY + 25, skin, 9, skin.muted);
  label(ctx, `${String(heading).padStart(3, '0')}°`, width / 2, tapeY + 27, skin, 17, skin.text, 'center');
  label(ctx, 'N   NE   E   SE   S   SW   W   NW', width / 2, tapeY + 56, skin, 8, skin.muted, 'center');
  const horizonY = height * 0.67;
  drawHorizon(ctx, margin + 45, horizonY, 34, plane, skin);
  const panelY = height - 101;
  plate(ctx, width / 2 - 215, panelY, 430, 76, skin, 0.96);
  label(ctx, `THR ${Math.round(plane.throttle * 100)}%`, width / 2 - 192, panelY + 22, skin, 10, skin.text);
  meter(ctx, width / 2 - 192, panelY + 31, 108, plane.throttle, skin.glow);
  label(ctx, `FLAPS ${Math.round(plane.flaps * 100)}%`, width / 2 - 57, panelY + 22, skin, 10, skin.text);
  meter(ctx, width / 2 - 57, panelY + 31, 88, plane.flaps, skin.warm);
  label(ctx, `FUEL ${Math.round(plane.fuel)}%`, width / 2 + 56, panelY + 22, skin, 10, skin.text);
  meter(ctx, width / 2 + 56, panelY + 31, 70, plane.fuel / 100, plane.fuel < 25 ? skin.danger : skin.glow);
  label(ctx, `HULL ${Math.round(plane.hull)}%`, width / 2 + 145, panelY + 22, skin, 10, skin.text);
  meter(ctx, width / 2 + 145, panelY + 31, 53, plane.hull / 100, plane.hull < 35 ? skin.danger : skin.warm);
  label(ctx, `VS ${plane.verticalSpeed >= 0 ? '+' : ''}${plane.verticalSpeed.toFixed(1)} M/S`, width / 2 - 190, panelY + 59, skin, 9, skin.muted);
  label(ctx, `${plane.gearDown ? 'GEAR DOWN' : 'GEAR UP'}  ·  ${plane.stall ? 'STALL' : 'TRIM'}`, width / 2 + 196, panelY + 59, skin, 9, plane.stall ? skin.danger : skin.muted, 'right');
  drawRadar(ctx, width - margin - 48, height * 0.68, skin, plane, weather, mission);
  label(ctx, 'TACTICAL RADAR', width - margin - 48, height * 0.68 + 61, skin, 8, skin.muted, 'center');
  const eventY = height * 0.18;
  if (mission.event) {
    label(ctx, mission.event, width / 2, eventY, skin, 10, mission.event.includes('SHEAR') || mission.event.includes('MAYDAY') ? skin.danger : skin.warm, 'center');
  }
  label(ctx, 'W/S PITCH   A/D BANK   Q/E YAW   SHIFT/CTRL THROTTLE   F FLAPS   G GEAR   SPACE DROP   V ROUTE', width / 2, height - 12, skin, 8, skin.muted, 'center');
}

export function drawFlightOverlay(ctx, game) {
  const { screen, mission, width, height, onStart } = game;
  const skin = SKINS[game.variant] ?? SKINS.teal;
  if (screen === 'title' || screen === 'paused') {
    ctx.fillStyle = 'rgba(3,14,21,.58)'; ctx.fillRect(0, 0, width, height);
    ctx.textAlign = 'center'; ctx.fillStyle = skin.text; ctx.font = '700 62px Georgia, serif';
    ctx.fillText('STORMPOST', width / 2, height * 0.31);
    ctx.fillStyle = skin.glow; ctx.font = '600 14px ui-monospace, monospace';
    ctx.fillText('ISLEWATCH  /  VOLCANIC ARCHIPELAGO', width / 2, height * 0.31 + 30);
    ctx.fillStyle = skin.warm; ctx.font = '600 18px ui-monospace, monospace';
    ctx.fillText(screen === 'paused' ? 'FLIGHT PAUSED' : 'A RESCUE FLIGHT THROUGH THE ASH LINE', width / 2, height * 0.46);
    ctx.fillStyle = skin.text; ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('ENTER  FLY   ·   1 RESCUE   ·   2 REEF RELAY   ·   3 CLIFF DELIVERY', width / 2, height * 0.54);
    ctx.fillStyle = skin.muted; ctx.font = '12px ui-monospace, monospace';
    ctx.fillText('KEYBOARD OR HOLD + DRAG MOUSE TO BANK / PITCH', width / 2, height * 0.59);
    ctx.fillText('STORM CUT = FAST, ROUGH AIR   /   SAFE LOOP = FUEL RESERVE', width / 2, height * 0.63);
    ctx.strokeStyle = skin.edge; ctx.beginPath(); ctx.moveTo(width * .32, height * .69); ctx.lineTo(width * .68, height * .69); ctx.stroke();
    ctx.fillStyle = skin.warm; ctx.font = '600 15px ui-monospace, monospace';
    ctx.fillText(mission.contract.name, width / 2, height * 0.74);
    ctx.fillStyle = skin.muted; ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(mission.contract.brief, width / 2, height * 0.78);
    ctx.fillStyle = skin.text; ctx.font = '700 14px ui-monospace, monospace';
    ctx.fillText(screen === 'paused' ? 'PRESS P TO RESUME' : 'PRESS ENTER OR CLICK TO LAUNCH', width / 2, height * 0.87);
  }
  if (screen === 'debrief' || screen === 'crash') {
    ctx.fillStyle = 'rgba(3,12,19,.68)'; ctx.fillRect(0, 0, width, height);
    plate(ctx, width * .22, height * .15, width * .56, height * .72, skin, 1);
    ctx.textAlign = 'center'; ctx.fillStyle = screen === 'crash' ? skin.danger : skin.glow;
    ctx.font = '700 15px ui-monospace, monospace'; ctx.fillText(screen === 'crash' ? 'MAYDAY // SORTIE LOST' : 'FLIGHT DEBRIEF  /  KORU CLIFF', width / 2, height * .31);
    ctx.fillStyle = skin.text; ctx.font = '700 74px Georgia, serif'; ctx.fillText(mission.grade || 'D', width / 2, height * .48);
    ctx.fillStyle = skin.warm; ctx.font = '600 17px ui-monospace, monospace'; ctx.fillText(`${mission.score.toLocaleString()} POINTS`, width / 2, height * .55);
    ctx.fillStyle = skin.muted; ctx.font = '13px ui-monospace, monospace';
    ctx.fillText(mission.debrief || 'AIRFRAME LOST // APPROACH NOT STABLE', width / 2, height * .62);
    ctx.fillText(`RINGS ${mission.rings}   ·   RESCUES ${mission.deliveries}   ·   FUEL ${Math.round(game.plane.fuel)}%   ·   HULL ${Math.round(game.plane.hull)}%`, width / 2, height * .68);
    ctx.fillStyle = skin.warm; ctx.font = '700 14px ui-monospace, monospace';
    ctx.fillText('1  FLARE RESCUE   ·   2  REEF RELAY   ·   3  CLIFF DELIVERY', width / 2, height * .75);
    ctx.fillStyle = skin.glow; ctx.font = '600 14px ui-monospace, monospace'; ctx.fillText('ENTER TO RE-FLY  /  CHOOSE A NEW CONTRACT ABOVE', width / 2, height * .82);
  }
}
