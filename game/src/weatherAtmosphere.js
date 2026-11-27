// Windshield precipitation and branching, tapered electrical discharges in world space.
import {mesh,ellipsoid,transform} from './webglEngine.js';
export function buildAtmosphere(engine){
 const ash=mesh();
 for(let i=0;i<7;i++){
  const a=i*2.399,r=i?.4:0;
  ellipsoid(ash,[Math.sin(a)*r,Math.cos(i*1.7)*.22,Math.cos(a)*r],[.66+i%3*.11,.85+i%2*.25,.65+i%2*.2],[.17+i%3*.02,.18+i%3*.02,.20+i%3*.02],12,16);
 }
 const plume=engine.upload(ash);
 let projected=[];
 const branches=[];
 let randomState=41327;
 const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
 function channel(start,end,depth){
  if(depth===0)return [start,end];
  const distance=Math.hypot(...end.map((v,i)=>v-start[i]));
  const middle=start.map((v,k)=>(v+end[k])*.5+(random()-.5)*distance*(k===1?.025:.21));
  const a=channel(start,middle,depth-1),b=channel(middle,end,depth-1);
  return [...a.slice(0,-1),...b];
 }
 function branch(start,end,width,depth){
  const points=channel(start,end,4);branches.push({points,width});
  if(depth>0)for(let j of [5,10]){
   const p=points[j],sign=j===5?-1:1;
   branch(p,[p[0]+sign*(90+random()*95),p[1]-110-random()*170,p[2]+(random()-.5)*80],width*.65,depth-1);
  }
 }
 branch([-490,900,-1530],[-550,65,-1510],1.8,2);
 return {draw(s,t){
  for(let i=14;i>=0;i--){
   const life=(i*.47+t*.12)%7,scale=8+life*7.5;
   engine.draw(plume,transform([-1280+life*31+Math.sin(i*2.3)*life*2,800+life*28,-2050-life*11+Math.cos(i)*life*3],[life,i,0],[scale,scale*1.45,scale]),{alpha:.18,soft:true});
  }
  projected=s.storm?branches.map(b=>({width:b.width,points:b.points.map(engine.project)})):[];
 },rain(ctx,w,h,t){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  const flash=Math.pow(Math.max(0,Math.sin(t*1.7)),38);
  if(flash>.025){
   const anchor=projected[0]?.points[7];
   if(anchor?.visible){
    const glow=ctx.createRadialGradient(anchor.x,anchor.y,2,anchor.x,anchor.y,w*.28);
    glow.addColorStop(0,'rgba(153,189,246,'+(flash*.2)+')');glow.addColorStop(1,'rgba(137,182,242,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h*.69);
   }
   for(let b of projected){
    if(!b.points.every(p=>p.visible))continue;
    for(let glow=3;glow>=0;glow--){
     ctx.strokeStyle=glow?'rgba(119,175,255,'+(flash*(glow===1?.37:.20))+')':'rgba(233,243,255,'+Math.min(1,flash*1.7)+')';
     ctx.shadowColor='#94bff8';ctx.shadowBlur=glow?14:3;
     for(let i=1;i<b.points.length;i++){
      const taper=1.-i/b.points.length*.52;
      ctx.lineWidth=(glow?Math.pow(glow,2)*3.6:.9)*b.width*taper*w/1280;
      const a=b.points[i-1],p=b.points[i];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(p.x,p.y);ctx.stroke();
     }
    }
   }
   ctx.shadowBlur=0;ctx.fillStyle='rgba(164,192,236,'+(flash*.055)+')';ctx.fillRect(0,0,w,h*.69);
  }
  for(let layer=0;layer<2;layer++){
   ctx.strokeStyle=layer?'rgba(203,226,238,.19)':'rgba(198,224,237,.11)';ctx.lineWidth=layer?.7:.45;ctx.beginPath();
   for(let i=0;i<100;i++){
    const x=(i*137+t*(layer?86:140))%w,y=(i*97+t*(layer?340:540))%(h*.70);
    ctx.moveTo(x,y);ctx.lineTo(x-5-layer*3,y+12+layer*8);
   }ctx.stroke();
  }
  for(let i=0;i<35;i++){
   const x=(i*197.3+32)%w,y=(i*83.7+Math.sin(t*.5+i)*3)%(h*.64),r=1.4+i%3;
   ctx.strokeStyle='rgba(199,222,235,.25)';ctx.lineWidth=.75;ctx.beginPath();ctx.ellipse(x,y,r*.65,r*1.4,-.22,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='rgba(229,240,250,.23)';ctx.beginPath();ctx.ellipse(x-.4,y-r*.5,r*.25,r*.35,0,0,6.283);ctx.fill();
  }
  ctx.restore();
 }};
}
