import { drawCockpitHud, drawFlightOverlay } from './hud.js';
import { drawRescueAircraft } from './aircraftModel.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function polygon(ctx, points, fill, stroke = null, lineWidth = 1) {
  if (!points.length) return;
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function project(game, worldX, worldZ, elevation = 0) {
  const depth = worldZ - game.plane.forward;
  const perspective = 800 / Math.max(260, depth + 370);
  const x = game.width * 0.5 + (worldX - game.plane.crossTrack) * perspective * 0.43;
  const y = game.horizon + perspective * (230 + elevation * 0.31) + perspective * perspective * 48;
  return { x, y, scale: perspective, depth };
}

function drawSky(ctx, game) {
  const { width: w, height: h, horizon, variant, weather, time } = game;
  const ember = variant === 'ember';
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, ember ? '#241722' : '#2b657a');
  sky.addColorStop(0.55, ember ? '#aa5c56' : '#7cb7a7');
  sky.addColorStop(1, ember ? '#f2b57d' : '#f3d29c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const sunX = w * (ember ? 0.72 : 0.2); const sunY = h * 0.2;
  const halo = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, h * 0.24);
  halo.addColorStop(0, ember ? 'rgba(255,211,147,.9)' : 'rgba(255,242,186,.94)');
  halo.addColorStop(0.12, 'rgba(255,220,157,.26)'); halo.addColorStop(1, 'rgba(255,220,157,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h * 0.58);
  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath();
    const yBase = horizon - 70 + layer * 24;
    ctx.moveTo(0, yBase + 60);
    for (let x = 0; x <= w + 60; x += 60) {
      const rise = Math.sin(x * 0.007 + layer * 2) * (24 + layer * 13) + Math.sin(x * 0.017 + layer) * 8;
      ctx.lineTo(x, yBase + rise);
    }
    ctx.lineTo(w, horizon + 30); ctx.lineTo(0, horizon + 30); ctx.closePath();
    ctx.fillStyle = [ember ? '#754b58' : '#477c80', ember ? '#543747' : '#34616b', ember ? '#342b3e' : '#244955'][layer];
    ctx.globalAlpha = 0.28 + layer * 0.12; ctx.fill(); ctx.globalAlpha = 1;
  }
  if (weather.severity > 0.14) {
    const cloud = ctx.createRadialGradient(w * .53, horizon - 68, 20, w * .53, horizon - 68, w * .52);
    cloud.addColorStop(0, `rgba(30,38,55,${weather.severity * .62})`); cloud.addColorStop(1, 'rgba(30,38,55,0)');
    ctx.fillStyle = cloud; ctx.fillRect(0, 0, w, horizon + 20);
    for (let i = 0; i < 5; i++) {
      const cx = w * .32 + i * 103 + Math.sin(time * .15 + i) * 14;
      ctx.fillStyle = `rgba(35,46,59,${weather.severity * .19})`;
      ctx.beginPath(); ctx.ellipse(cx, horizon - 78 + Math.sin(i) * 12, 90, 24, 0, 0, TAU); ctx.fill();
    }
  }
  const sea = ctx.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, ember ? '#2b4c5a' : '#167c87'); sea.addColorStop(.5, ember ? '#1b3849' : '#125b70'); sea.addColorStop(1, '#0c293c');
  ctx.fillStyle = sea; ctx.fillRect(0, horizon, w, h - horizon);
  ctx.globalAlpha = .16;
  for (let i = 0; i < 18; i++) {
    const y = horizon + 22 + i * i * 1.75;
    if (y > h) break;
    const span = Math.min(w * .46, 70 + i * 42);
    ctx.strokeStyle = i % 3 ? '#8ee3d1' : '#e1d096'; ctx.lineWidth = i < 4 ? 1 : 2;
    ctx.beginPath(); ctx.moveTo(w / 2 - span, y); ctx.lineTo(w / 2 + span, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawIsland(ctx, game, island) {
  const at = project(game, island.x, island.z, 0);
  if (at.depth < -400 || at.depth > 9000 || at.x < -500 || at.x > game.width + 500) return;
  const s = at.scale;
  const rx = island.rx * s * .22; const rz = island.rz * s * .065;
  const peak = island.peak * s * .29;
  if (rx < 3) return;
  const colors = island.tone === 'reef'
    ? { reef: '#59c8b8', shore: '#c8bd91', land: '#536e63', shade: '#304b4d' }
    : island.tone === 'ash'
      ? { reef: '#448d8f', shore: '#b98a69', land: '#59494d', shade: '#352d3c' }
      : { reef: '#3b9c99', shore: '#d1a577', land: '#445a58', shade: '#263f43' };
  ctx.save();
  ctx.globalAlpha = clamp(.34 + s * .35, .18, .85);
  ctx.fillStyle = colors.reef; ctx.beginPath(); ctx.ellipse(at.x, at.y + 10 * s, rx * 1.18, rz * 1.42, .02, 0, TAU); ctx.fill();
  ctx.fillStyle = colors.shore; ctx.beginPath(); ctx.ellipse(at.x, at.y, rx, rz, .03, 0, TAU); ctx.fill();
  const points = [];
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * TAU; const n = .88 + .1 * Math.sin(a * 3 + island.z) + .04 * Math.cos(a * 7);
    points.push([at.x + Math.cos(a) * rx * n, at.y + Math.sin(a) * rz * n]);
  }
  polygon(ctx, points, colors.land, 'rgba(255,238,186,.22)', 1);
  const ridge = [[at.x - rx * .65, at.y - rz * .16], [at.x - rx * .28, at.y - rz * .68 - peak * .4], [at.x, at.y - rz * .24 - peak], [at.x + rx * .18, at.y - rz * .6 - peak * .42], [at.x + rx * .62, at.y - rz * .05], [at.x + rx * .38, at.y + rz * .2], [at.x - rx * .22, at.y + rz * .24]];
  polygon(ctx, ridge, colors.shade, 'rgba(234,199,147,.28)', 1);
  ctx.strokeStyle = 'rgba(210,224,194,.3)'; ctx.lineWidth = Math.max(1, s * 2);
  ctx.beginPath(); ctx.moveTo(at.x - rx * .3, at.y - rz * .4); ctx.lineTo(at.x - rx * .04, at.y - rz * .52 - peak * .55); ctx.lineTo(at.x + rx * .17, at.y - rz * .2); ctx.stroke();
  if (island.name === 'KORU CALDERA' || island.tone === 'ash') {
    const craterX = at.x + rx * .08; const craterY = at.y - rz * .22 - peak * .72;
    ctx.strokeStyle = 'rgba(255,165,97,.76)'; ctx.lineWidth = Math.max(1.5, s * 4);
    ctx.beginPath(); ctx.ellipse(craterX, craterY, Math.max(4, rx * .11), Math.max(2, rz * .18), -.08, 0, TAU); ctx.stroke();
    const glow = ctx.createRadialGradient(craterX, craterY, 1, craterX, craterY, Math.max(18, rx * .35));
    glow.addColorStop(0, 'rgba(255,104,59,.48)'); glow.addColorStop(1, 'rgba(255,104,59,0)');
    ctx.fillStyle = glow; ctx.fillRect(craterX - rx * .4, craterY - rx * .4, rx * .8, rx * .8);
    ctx.fillStyle = 'rgba(50,51,55,.36)';
    for (let puff = 0; puff < 5; puff++) {
      const drift = Math.sin(game.time * .4 + puff) * rx * .04;
      ctx.beginPath(); ctx.ellipse(craterX + drift, craterY - puff * Math.max(4, s * 13), Math.max(3, s * (10 + puff * 2)), Math.max(4, s * (13 + puff * 2)), -.1, 0, TAU); ctx.fill();
    }
  }
  if (s > .14) {
    ctx.fillStyle = 'rgba(255,226,174,.8)';
    for (let i = 0; i < 7; i++) {
      const lx = at.x + Math.sin(island.z + i * 13) * rx * .62;
      const ly = at.y + Math.cos(i * 3) * rz * .48;
      ctx.globalAlpha = .2 + Math.sin(game.time * 2 + i) * .1;
      ctx.fillRect(lx, ly, Math.max(1, s * 2), Math.max(1, s * 2));
    }
  }
  ctx.restore();
}

function drawRunway(ctx, game, runway) {
  const near = project(game, runway.x, runway.z + runway.length / 2, runway.elevation);
  const far = project(game, runway.x, runway.z - runway.length / 2, runway.elevation);
  if (near.depth < -500 || far.depth < -500 || near.depth > 8000) return;
  const halfNear = runway.width * near.scale * .48; const halfFar = runway.width * far.scale * .48;
  polygon(ctx, [[near.x - halfNear, near.y], [near.x + halfNear, near.y], [far.x + halfFar, far.y], [far.x - halfFar, far.y]], '#28383c', 'rgba(250,223,161,.82)', 1.2);
  ctx.strokeStyle = '#e9d5a1'; ctx.lineWidth = 2;
  for (let i = 1; i <= 5; i++) {
    const t = i / 6; const px = near.x + (far.x - near.x) * t; const py = near.y + (far.y - near.y) * t;
    const width = halfNear * (1 - t) + halfFar * t;
    ctx.beginPath(); ctx.moveTo(px - width * .54, py); ctx.lineTo(px - width * .42, py); ctx.moveTo(px + width * .42, py); ctx.lineTo(px + width * .54, py); ctx.stroke();
  }
  for (let side of [-1, 1]) {
    const papiX = near.x + side * halfNear * .8;
    for (let i = 0; i < 4; i++) {
      const yy = near.y - i * Math.max(2, near.scale * 7);
      ctx.fillStyle = i < 2 ? '#ff604f' : '#fff0b4'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(papiX, yy, Math.max(1.5, near.scale * 3.3), 0, TAU); ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  const threshold = project(game, runway.x, runway.z - runway.length * .34, runway.elevation);
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = i === 0 ? '#fff2bd' : '#ffb65b'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 11;
    ctx.beginPath(); ctx.arc(threshold.x + i * threshold.scale * 15, threshold.y, Math.max(2, threshold.scale * 5), 0, TAU); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawBeacon(ctx, game, target, color, label) {
  const p = project(game, target.x, target.z, 0);
  if (p.depth < 70 || p.depth > 6300) return;
  const radius = clamp(54 * p.scale, 8, 72);
  ctx.save(); ctx.translate(p.x, p.y - radius * .35);
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, p.scale * 4); ctx.shadowColor = color; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * 1.14, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, radius * 1.14); ctx.lineTo(0, radius * 2.4); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, radius * 2.4, Math.max(3, p.scale * 6), 0, TAU); ctx.fill();
  ctx.shadowBlur = 0; ctx.font = `700 ${Math.max(8, 11 * p.scale)}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.fillText(label, 0, -radius * 1.38);
  ctx.restore();
}

function drawParachute(ctx, game) {
  const crate = game.mission.crate;
  if (!crate || crate.scored) return;
  const p = project(game, game.mission.beacon.x, game.mission.beacon.z, 70);
  const drop = clamp((1.55 - crate.timer) / 1.55, 0, 1);
  const y = p.y - 70 * p.scale + drop * 105 * p.scale;
  const x = p.x + Math.sin(game.time * 1.4) * 12 * p.scale;
  const s = clamp(p.scale, .25, 1.2);
  ctx.save(); ctx.strokeStyle = '#fff0c5'; ctx.lineWidth = 2 * s;
  ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 17 * s); ctx.quadraticCurveTo(x, y - 43 * s, x + 16 * s, y - 17 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 17 * s); ctx.lineTo(x, y); ctx.lineTo(x + 16 * s, y - 17 * s); ctx.stroke();
  ctx.fillStyle = '#ffb65b'; ctx.fillRect(x - 7 * s, y, 14 * s, 12 * s);
  ctx.fillStyle = 'rgba(255,214,143,.16)'; ctx.beginPath(); ctx.arc(x, y + 7 * s, 25 * s, 0, TAU); ctx.fill(); ctx.restore();
}

function drawRain(ctx, game) {
  const density = Math.round(game.weather.severity * 90);
  if (density < 1) return;
  ctx.strokeStyle = `rgba(200,232,239,${.12 + game.weather.severity * .16})`; ctx.lineWidth = 1;
  for (let i = 0; i < density; i++) {
    const x = (i * 137 + Math.sin(game.time * 7 + i) * 70 + game.time * 115) % game.width;
    const y = (i * 83 + game.time * 280) % game.height;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 21); ctx.stroke();
  }
}

function drawScene(ctx, game) {
  drawSky(ctx, game);
  ctx.save();
  const shake = Math.min(4, game.camera.shake);
  ctx.translate(game.width * .5 + Math.sin(game.time * 28) * shake, game.horizon);
  ctx.rotate(-game.camera.roll * .62);
  ctx.translate(-game.width * .5, -game.horizon);
  for (const island of game.terrain.islands) drawIsland(ctx, game, island);
  for (const runway of game.terrain.runways) drawRunway(ctx, game, runway);
  drawBeacon(ctx, game, game.mission.ring, '#97ffe2', 'ROUTE RING');
  drawBeacon(ctx, game, game.mission.beacon, '#ffb65b', 'FLARE / DROP');
  ctx.restore();
  drawRain(ctx, game);
  if (game.weather.lightning > 0) { ctx.fillStyle = `rgba(226,239,255,${game.weather.lightning * .22})`; ctx.fillRect(0, 0, game.width, game.height); }
  drawParachute(ctx, game);
  drawRescueAircraft(ctx, game.width * .5, game.height * .58, game.height / 720, game.plane.roll, game.time, game.plane.flaps, game.plane.hull);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  let width = 1280; let height = 720; let dpr = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(360, rect.width); height = Math.max(300, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(game) {
    if (Math.abs(canvas.clientWidth - width) > 1 || Math.abs(canvas.clientHeight - height) > 1) resize();
    game.width = width; game.height = height;
    game.horizon = height * .37 + game.camera.pitch * height * .38;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawScene(ctx, game);
    if (game.screen !== 'title' && game.screen !== 'crash' && game.screen !== 'debrief') drawCockpitHud(ctx, game);
    if (game.screen === 'title' || game.screen === 'paused' || game.screen === 'crash' || game.screen === 'debrief') drawFlightOverlay(ctx, game);
  }
  resize(); window.addEventListener('resize', resize);
  return { draw, resize, get context() { return ctx; } };
}
