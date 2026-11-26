export function drawRescueAircraft(ctx, x, y, scale, roll, time, flap, hull) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(roll * 0.34);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#091923';
  ctx.beginPath();
  ctx.moveTo(0, -76); ctx.lineTo(16, -38); ctx.lineTo(118, 3); ctx.lineTo(124, 13);
  ctx.lineTo(36, 12); ctx.lineTo(25, 42); ctx.lineTo(52, 51); ctx.lineTo(48, 60);
  ctx.lineTo(0, 51); ctx.lineTo(-48, 60); ctx.lineTo(-52, 51); ctx.lineTo(-25, 42);
  ctx.lineTo(-36, 12); ctx.lineTo(-124, 13); ctx.lineTo(-118, 3); ctx.lineTo(-16, -38); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  const metal = ctx.createLinearGradient(-125, 0, 125, 0);
  metal.addColorStop(0, '#74979a'); metal.addColorStop(0.45, '#f2e7c9'); metal.addColorStop(1, '#4d7881');
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.moveTo(0, -82); ctx.lineTo(13, -40); ctx.lineTo(114, 1); ctx.lineTo(118, 7);
  ctx.lineTo(31, 7); ctx.lineTo(24, 33); ctx.lineTo(48, 43); ctx.lineTo(44, 49);
  ctx.lineTo(0, 43); ctx.lineTo(-44, 49); ctx.lineTo(-48, 43); ctx.lineTo(-24, 33);
  ctx.lineTo(-31, 7); ctx.lineTo(-118, 7); ctx.lineTo(-114, 1); ctx.lineTo(-13, -40); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,246,216,.82)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-100, 3); ctx.lineTo(-30, 9); ctx.lineTo(0, 41); ctx.lineTo(30, 9); ctx.lineTo(100, 3); ctx.stroke();
  ctx.fillStyle = '#d97854';
  ctx.beginPath(); ctx.moveTo(-15, -42); ctx.lineTo(0, -82); ctx.lineTo(15, -42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#172d3b';
  ctx.beginPath(); ctx.ellipse(0, -43, 7, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(101,224,227,.88)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-12, -36); ctx.lineTo(-5, -29); ctx.lineTo(5, -29); ctx.lineTo(12, -36); ctx.stroke();
  ctx.fillStyle = '#202a30';
  ctx.fillRect(-90, 2, 26, 8); ctx.fillRect(64, 2, 26, 8);
  ctx.fillStyle = '#ffbf69'; ctx.fillRect(-90, 1 + flap * 7, 26, 3); ctx.fillRect(64, 1 + flap * 7, 26, 3);
  ctx.fillStyle = '#ff454e'; ctx.shadowColor = '#ff4048'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(-113, 5, 4, 0, 7); ctx.fill();
  ctx.fillStyle = '#4affd4'; ctx.shadowColor = '#4affd4'; ctx.beginPath(); ctx.arc(113, 5, 4, 0, 7); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,225,145,.7)'; ctx.lineWidth = 1.5;
  const spin = time * 27;
  for (const side of [-1, 1]) {
    const px = side * 82;
    ctx.save(); ctx.translate(px, -1); ctx.rotate(spin * side);
    ctx.strokeStyle = 'rgba(255,245,216,.68)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 18, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#182b34'; ctx.beginPath(); ctx.arc(px, -1, 5.5, 0, 7); ctx.fill();
  }
  if (hull < 48) {
    ctx.strokeStyle = 'rgba(255,105,74,.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-16, -52); ctx.lineTo(-4, -15); ctx.lineTo(14, 3); ctx.stroke();
  }
  ctx.restore();
}
