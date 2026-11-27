// Contact-energy resolution, grounded wreckage and buoyant turbulent combustion.
import {terrainHeight,runway} from './terrainWorld.js';
import {mesh,ellipsoid,box,triangle,transform} from './webglEngine.js';
export function resolveContact(s,dt){
 if(s.status==='landed'){
  s.speed=Math.max(0,s.speed-dt*(s.brake?14:2));
  s.pos[2]-=s.speed*dt;s.pos[1]=runway.y+7.8;return;
 }
 if(s.status!=='flying')return;
 const ground=Math.max(0,terrainHeight(s.pos[0],s.pos[2]));
 const contactHeight=s.gear?7.8:3.1;
 if(s.pos[1]>ground+contactHeight)return;
 const onStrip=Math.abs(s.pos[0]-runway.x)<runway.width/2&&s.pos[2]<runway.z0&&s.pos[2]>runway.z1;
 if(onStrip&&s.gear&&s.verticalSpeed>-4&&s.speed<65&&Math.abs(s.roll)<.18){
  s.status='landed';s.flare=s.verticalSpeed>-1.5?'BUTTER LANDING':'CONTROLLED TOUCHDOWN';
  s.event=s.flare+' — HOLD B TO BRAKE';s.score+=1500;
  s.pos[1]=ground+7.8;
 }else{
  s.status='crashed';s.cause=(s.stall?'STALL / ':onStrip&&!s.gear?'GEAR COLLAPSE / ':'HARD IMPACT / ')+s.verticalSpeed.toFixed(1)+' M/S';
  s.impactSpeed=s.speed;s.hull=0;s.speed=0;s.verticalSpeed=0;
  s.pos[1]=ground+2.5;s.roll=.24;s.pitch=-.12;s.event='AIRFRAME LOST';
 }
 s.contactTime=s.elapsed;
}
export function buildImpactEffects(engine){
 const smoke=mesh(),flame=mesh(),debris=mesh(),scorch=mesh(),spark=mesh();
 // Unequal intersecting lobes form full volumes, never camera-facing smoke discs.
 for(let i=0;i<7;i++){
  const a=i*2.399,r=i? .44:0;
  ellipsoid(smoke,[Math.sin(a)*r,Math.cos(i*3)*.27,Math.cos(a)*r],[.64+i%3*.12,.78+i%2*.21,.66+i%2*.15],[.085+i%3*.014,.092+i%3*.014,.10+i%3*.012],10,14);
 }
 for(let i=0;i<5;i++){
  const a=i*1.256;
  triangle(flame,[Math.sin(a)*1.5,0,Math.cos(a)*1.5],[Math.sin(a+1.2)*1.3,0,Math.cos(a+1.2)*1.3],[Math.sin(a*.7)*.4,4+i%3,Math.cos(a)*.3],[1,.32,.025]);
 }
 box(debris,[0,0,0],[1,.18,1],[.11,.12,.12]);
 ellipsoid(scorch,[0,0,0],[1,.015,1],[.045,.043,.04],5,18);
 box(spark,[0,0,0],[.1,.55,.1],[1,.58,.1]);
 const g=Object.fromEntries(Object.entries({smoke,flame,debris,scorch,spark}).map(([k,m])=>[k,engine.upload(m)]));
 return {draw(s,t){
  if(s.status!=='crashed')return;
  const base=s.pos,ground=base[1]-2.4,age=t-s.contactTime;
  engine.draw(g.scorch,transform([base[0],ground+.02,base[2]],[0,0,0],[22,1,15]));
  for(let i=0;i<25;i++){
   const a=i*2.399,d=4+Math.sqrt(i)*4;
   engine.draw(g.debris,transform([base[0]+Math.sin(a)*d,ground+.2,base[2]+Math.cos(a)*d],[Math.sin(i)*.15,i*.7,0],[1+i%4,.8,2+i%3]));
  }
  for(let i=17;i>=0;i--){
   const life=(i*.73+age*.58)%12,a=i*2.399,scale=2.3+life*.95;
   const opacity=(1.-life/15.)*.42;
   engine.draw(g.smoke,transform([base[0]-6+life*1.4+Math.sin(a+life*.4)*life*.5,ground+6+life*5.8,base[2]+3+Math.cos(a)*life*.7],[i*.27,life*.25,i*.3],[scale,scale*1.35,scale]),{alpha:opacity,soft:true});
  }
  for(let i=0;i<6;i++){
   const f=.7+.3*Math.sin(t*9+i*2.1);
   engine.draw(g.flame,transform([base[0]-7+Math.sin(i*7)*3,ground+.3,base[2]+3+Math.cos(i*4)*3],[0,i+t*.13,0],[.7,f*.9,.7]),{emission:1.3,alpha:.85});
  }
  for(let i=0;i<65;i++){
   const a=i*2.399,k=(i*.173+age*.7)%5;
   engine.draw(g.spark,transform([base[0]-5+Math.sin(a)*(2+k),ground+1+k*3.7,base[2]+3+Math.cos(a)*(2+k)],[i,0,-.5],[1,1+i%3*.3,1]),{emission:2,alpha:1-k/6});
  }
 }};
}
