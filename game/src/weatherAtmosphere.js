// Soft-lit cumulus layers, storm anvils, drifting caldera ash and windshield weather.
import {mesh,ellipsoid,rod,transform} from './webglEngine.js';
export function buildAtmosphere(engine){
 const cumulus=mesh(),anvil=mesh(),ash=mesh(),bolt=mesh();
 // Overlapping smooth lobes share one illumination model; no faceted sphere normals.
 for(let j=0;j<13;j++){
  const a=j*2.399,r=42+Math.sqrt(j)*20;
  ellipsoid(cumulus,[Math.sin(a)*r,Math.cos(j*1.7)*15+18,Math.cos(a)*r*.55],[62+j%3*13,33+j%4*9,53],[1,.98,.94],12,20);
 }
 for(let j=0;j<14;j++){
  const x=(j%7-3)*85,y=j<7?0:70;
  ellipsoid(anvil,[x,y,Math.sin(j*2)*35],[120,j<7?54:35,85],[.62,.69,.77],12,20);
 }
 ellipsoid(ash,[0,0,0],[1,1,1],[.45,.43,.40],12,18);
 const pts=[[0,200,0],[-12,160,0],[7,162,0],[-18,110,0],[-6,112,0],[-28,53,0],[-16,57,0],[-43,-35,0],[-60,-150,0],[-48,-145,0],[-70,-290,0],[-84,-430,0]];
 for(let i=1;i<pts.length;i++)rod(bolt,pts[i-1],pts[i],1.0,[.73,.86,1],6);
 const g=Object.fromEntries(Object.entries({cumulus,anvil,ash,bolt}).map(([k,m])=>[k,engine.upload(m)]));
 return {draw(s,t){
  for(let i=0;i<6;i++)engine.draw(g.cumulus,transform([-2700+i*980,1120+i%2*180,-5500-i%3*760],[0,i*.4,0],[1.4,1,1.2]),{cloud:1,alpha:.91,soft:true});
  // A shallow ash column breaks into wind-drifted puffs rather than a solid cone.
  for(let i=8;i>=0;i--){
   const life=(i*.73+t*.12)%7,scale=12+life*9;
   engine.draw(g.ash,transform([-720+life*32+Math.sin(life*1.8)*18,600+life*29,-1800-life*10+Math.cos(life*2.1)*14],[0,life*.3,0],[scale,scale*.7,scale]),{cloud:1,alpha:.22,soft:true});
  }
  if(s.storm){
   for(let i=0;i<3;i++)engine.draw(g.anvil,transform([-700+i*600,730+i*40,-1900-i*420]),{cloud:1,alpha:.88,soft:true});
   if(Math.sin(t*1.7)>.9||s.paused)engine.draw(g.bolt,transform([-530,520,-1350]),{emission:2.2});
  }
 },rain(ctx,w,h,t){
  ctx.save();ctx.lineCap='round';
  for(let layer=0;layer<2;layer++){
   ctx.strokeStyle=layer?'rgba(195,227,244,.18)':'rgba(198,224,237,.10)';ctx.lineWidth=layer?1.4:.8;ctx.beginPath();
   for(let i=0;i<45;i++){
    const x=(i*137+t*(layer?86:140))%w,y=(i*97+t*(layer?240:440))%(h*.69);
    ctx.moveTo(x,y);ctx.lineTo(x-5-layer*5,y+18+layer*12);
   }ctx.stroke();
  }
  if(Math.sin(t*1.7)>.98){ctx.fillStyle='rgba(184,209,242,.055)';ctx.fillRect(0,0,w,h*.69);}
  ctx.restore();
 }};
}
