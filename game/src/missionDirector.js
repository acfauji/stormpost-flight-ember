// Relay gates, ballistic cargo releases, rescue scoring and a coastal flare beacon.
import {mesh,torus,rod,ellipsoid,box,quad,transform} from './webglEngine.js';
import {terrainHeight,runway} from './terrainWorld.js';
export const contracts=['FLARE RESCUE','REEF RELAY','CLIFF DELIVERY'];
export const rescueZone={x:-300,z:-1150,radius:220};
export function createMissionDirector(engine){
 const ring=mesh(),beacon=mesh(),canopy=mesh(),cargo=mesh(),smoke=mesh();
 torus(ring,[0,0,0],95,2.4,[1,.56,.09]);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  rod(ring,[Math.cos(a)*103,Math.sin(a)*103,0],[Math.cos(a)*110,Math.sin(a)*110,0],.65,[1,.81,.38],5);
 }
 const ground=terrainHeight(rescueZone.x,rescueZone.z);
 // A coastal promontory remains visible through the storm-approach windshield.
 const stormFlare={x:-525,z:-1550};
 stormFlare.y=terrainHeight(stormFlare.x,stormFlare.z);
 box(beacon,[0,.8,0],[2,1.6,2],[.4,.17,.07]);
 rod(beacon,[0,0,0],[0,3,0],.27,[1,.22,.03],8,.08);
 ellipsoid(beacon,[0,3.2,0],[.48,.6,.48],[1,.72,.28],8,12);
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
  for(let j=0;j<6;j++){
   const point=(a,j)=>{const r=j/6*15;return [Math.cos(a)*r,20+Math.sqrt(Math.max(0,225-r*r))*.5,Math.sin(a)*r];};
   quad(canopy,point(a,j),point(a,j+1),point(b,j+1),point(b,j),i%4<2?[.95,.51,.11]:[.85,.84,.68]);
  }
  rod(canopy,[Math.cos(a)*15,20,Math.sin(a)*15],[Math.cos(a)*1.6,1,Math.sin(a)*1.6],.065,[.75,.80,.75],4);
 }
 box(cargo,[0,-1,0],[4.5,4.5,4.5],[.30,.39,.30]);
 for(let x of [-1.5,1.5])box(cargo,[x,-1,-2.3],[.25,4.5,.15],[.84,.72,.45]);
 box(cargo,[0,-1,-2.38],[2,.35,.08],[.96,.84,.61]);
 box(cargo,[0,-1,-2.39],[.35,2,.08],[.96,.84,.61]);
 for(let i=0;i<5;i++){
  const a=i*2.399;
  ellipsoid(smoke,[Math.sin(a)*.3,Math.cos(i*2.1)*.3,Math.cos(a)*.3],[.73+i%2*.15,1.1+i%3*.13,.76+i%2*.17],[.75+i%3*.035,.25+i%2*.035,.06],10,14);
 }
 const g=Object.fromEntries(Object.entries({ring,beacon,canopy,cargo,smoke}).map(([k,m])=>[k,engine.upload(m)]));
 const gates=[[-220,345,-550],[-400,420,-1450],[200,300,-2600]],supplies=[];
 return {supplies,gates,reset(){supplies.length=0;},drop(s){
  if(s.status!=='flying'||supplies.length>=3)return false;
  supplies.push({pos:[...s.pos],velocity:[Math.sin(s.heading)*s.speed,0,-Math.cos(s.heading)*s.speed],landed:false,age:0});
  s.drop=true;if(s.contract===2&&s.rings>0)s.contract=1;s.event='SUPPLY CHUTE AWAY — WATCH DRIFT';return true;
 },update(s,dt){
  for(let p of supplies){
   if(p.landed)continue;p.age+=dt;
   p.velocity[0]*=Math.exp(-dt*.75);p.velocity[2]*=Math.exp(-dt*.75);
   p.pos[0]+=(p.velocity[0]+s.wind*.18)*dt;p.pos[2]+=p.velocity[2]*dt;
   p.pos[1]-=dt*(p.age<1.2?4+p.age*6:11.2);
   const floor=Math.max(0,terrainHeight(p.pos[0],p.pos[2]))+3;
   if(p.pos[1]<=floor){
    p.pos[1]=floor;p.landed=true;
    const success=Math.hypot(p.pos[0]-rescueZone.x,p.pos[2]-rescueZone.z)<rescueZone.radius;
    s.event=success?'RESCUE DELIVERED +1200 — RETURN RUNWAY 18':'DROP MISSED — TRY CLOSER';
    if(success){s.score+=1200;s.rescues=(s.rescues||0)+1;s.contract=3;}
   }
  }
  const target=gates[s.rings||0];
  if(s.contract===2&&target&&Math.hypot(s.pos[0]-target[0],s.pos[1]-target[1],s.pos[2]-target[2])<95){
   s.rings=(s.rings||0)+1;s.score+=400;s.event=s.rings===3?'RELAY COMPLETE — RETURN RUNWAY 18':'GATE CLEARED +400 — RESCUE BEACON AHEAD';
  }
  if(s.gear&&s.status==='flying'&&Math.abs(s.pos[0]-runway.x)<60&&s.pos[2]>runway.z1&&s.pos[2]<200){
   s.event='FINAL 18 • FLAPS 30 • GEAR DOWN';
  }
 },drawRescueRibbon(ctx,s){
  if(s.camera!=='cockpit'||!s.storm||s.status!=='flying')return;
  // World-anchored, camera-facing smoke; deliberately unlit by storm fog.
  // Draw beneath cockpit/HUD so terrain, dials and altitude stay authoritative.
  ctx.save();
  const W=ctx.canvas.width,H=ctx.canvas.height;
  ctx.beginPath();ctx.rect(0,H*.465,W,H*.235);ctx.clip();
  for(let i=35;i>=0;i--){
   const t=i/35,drift=t*t*86;
   const position=[stormFlare.x-drift+Math.sin(t*9)*t*5,stormFlare.y+3.2+t*48,stormFlare.z-t*12];
   const p=engine.project(position);
   const edge=engine.project([position[0]+1,position[1],position[2]]);
   if(!p.visible)continue;
   const r=Math.max(3,Math.min(17,Math.hypot(edge.x-p.x,edge.y-p.y)*(2.5+t*11)));
   const opacity=.39*Math.pow(1-t,.55),red=Math.round(255-t*81),warm=Math.round(99+t*53),blue=Math.round(29+t*108);
   const puff=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
   puff.addColorStop(0,'rgba('+red+','+warm+','+blue+','+opacity+')');
   puff.addColorStop(.42,'rgba('+red+','+warm+','+blue+','+opacity*.68+')');
   puff.addColorStop(1,'rgba('+red+','+warm+','+blue+',0)');
   ctx.fillStyle=puff;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
  }
  const core=engine.project([stormFlare.x,stormFlare.y+3.2,stormFlare.z]);
  if(core.visible){
   ctx.globalCompositeOperation='lighter';
   const glow=ctx.createRadialGradient(core.x,core.y,0,core.x,core.y,13);
   glow.addColorStop(0,'rgba(255,214,124,.98)');glow.addColorStop(.22,'rgba(255,70,12,.86)');glow.addColorStop(1,'rgba(255,55,0,0)');
   ctx.fillStyle=glow;ctx.fillRect(core.x-13,core.y-13,26,26);
  }
  ctx.restore();
 },draw(s){
  for(let i=0;i<gates.length;i++)if(s.contract===2&&i>=(s.rings||0))engine.draw(g.ring,transform(gates[i]),{emission:i===(s.rings||0)?.65:.18});
  // Low coastal marker: a bright point source and a narrow wind-carried ribbon.
  // Suppress distant mission smoke after impact so it cannot pierce wreck smoke.
  if(s.status!=='crashed'){
   const rescueView=s.camera==='cockpit'&&s.storm;
   const flareScale=1,flare=rescueView?stormFlare:{x:rescueZone.x,y:ground,z:rescueZone.z};
   engine.draw(g.beacon,transform([flare.x,flare.y,flare.z],[0,0,0],[flareScale,flareScale,flareScale]),{emission:rescueView?5:2.8});
   for(let i=rescueView?-1:10;i>=0;i--){
    const life=(i*.31+s.elapsed*.28)%3.5,r=(.55+life*.38)*(rescueView?2.2:1);
    engine.draw(g.smoke,transform([rescueZone.x+life*3.2,ground+2+life*(rescueView?15:8),rescueZone.z+life*.6],[i,life,0],[r,r*1.65,r*.65]),{alpha:(rescueView?.48:.19)*(1-life/4),emission:rescueView?.7:.10,soft:true});
   }
  }
  for(let p of supplies){
   engine.draw(g.cargo,transform(p.pos));
   if(!p.landed)engine.draw(g.canopy,transform(p.pos),{alpha:.94});
  }
 }};
}
