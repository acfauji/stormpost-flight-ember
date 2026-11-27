// Compact heading-up radar with live mission and runway guidance.
import {radarObjectives} from './missionDirector.js';
export function drawTacticalRadar(ctx,s,x=1190,y=670){
 const radius=55,scale=radius/9260,heading=s.heading||0,objectives=radarObjectives(s);
 const point=(wx,wz)=>{
  const dx=wx-s.pos[0],dz=wz-s.pos[2];
  const right=dx*Math.cos(heading)+dz*Math.sin(heading);
  const ahead=dx*Math.sin(heading)-dz*Math.cos(heading);
  let px=right*scale,py=-ahead*scale,d=Math.hypot(px,py),limit=radius-7;
  if(d>limit){px*=limit/d;py*=limit/d;}
  return [x+px,y+py];
 };
 const dot=(px,py,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();};
 ctx.save();ctx.beginPath();ctx.arc(x,y,radius+3,0,Math.PI*2);ctx.clip();
 ctx.fillStyle='rgba(5,14,21,.88)';ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
 ctx.strokeStyle='rgba(139,203,205,.30)';ctx.lineWidth=.8;
 for(const r of [18,36,55]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
 ctx.beginPath();ctx.moveTo(x-radius,y);ctx.lineTo(x+radius,y);ctx.moveTo(x,y-radius);ctx.lineTo(x,y+radius);ctx.stroke();
 const [sx,sy]=point(objectives.storm[0],objectives.storm[1]),stormR=objectives.storm[2]*scale;
 ctx.strokeStyle=s.storm?'rgba(255,106,57,.95)':'rgba(205,137,75,.46)';ctx.lineWidth=1.6;ctx.setLineDash([3,2]);
 ctx.beginPath();ctx.ellipse(sx,sy,stormR,stormR*.72,-.32,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 const [rx,ry]=point(objectives.runway[0],objectives.runway[1]);
 ctx.strokeStyle='rgba(117,224,185,.82)';ctx.lineWidth=1.2;ctx.setLineDash([4,3]);
 ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(rx,ry);ctx.stroke();ctx.setLineDash([]);
 const angle=Math.atan2(ry-y,rx-x);
 ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-Math.cos(angle-.55)*6,ry-Math.sin(angle-.55)*6);ctx.lineTo(rx-Math.cos(angle+.55)*6,ry-Math.sin(angle+.55)*6);ctx.closePath();ctx.fillStyle='#75e0b9';ctx.fill();
 dot(rx,ry,2.5,'#c0ffe7');
 if(objectives.beacon){
  const [bx,by]=point(objectives.beacon[0],objectives.beacon[1]),pulse=7+3*(.5+.5*Math.sin((s.elapsed||0)*4));
  ctx.strokeStyle='rgba(255,179,82,.86)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(bx,by,pulse,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='rgba(255,179,82,.42)';ctx.beginPath();ctx.arc(bx,by,pulse*1.55,0,Math.PI*2);ctx.stroke();dot(bx,by,2.4,'#ffc15d');
 }
 if(objectives.gate){
  const [gx,gy]=point(objectives.gate[0],objectives.gate[2]);
  ctx.strokeStyle='#f4d17f';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(gx,gy-4);ctx.lineTo(gx+4,gy);ctx.lineTo(gx,gy+4);ctx.lineTo(gx-4,gy);ctx.closePath();ctx.stroke();
 }
 ctx.strokeStyle='#a9e5e9';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x-4,y+4);ctx.lineTo(x,y+2);ctx.lineTo(x+4,y+4);ctx.closePath();ctx.stroke();
 ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='rgba(8,17,24,.82)';ctx.fillRect(x-radius-2,y+radius+2,radius*2+4,16);
 ctx.font='9px monospace';ctx.fillStyle='#d5eeee';ctx.fillText('WX / 5 NM',x,y+radius+13);
 ctx.textAlign='left';ctx.font='7px monospace';
 ctx.fillStyle='#ffb35d';ctx.fillText('PING',x-radius-1,y+radius+25);
 ctx.fillStyle='#f4d17f';ctx.fillText('GATE',x-radius+27,y+radius+25);
 ctx.fillStyle='#75e0b9';ctx.fillText('RWY 18',x-radius+58,y+radius+25);
 ctx.textAlign='left';
}
